/* VERSION 1.1.0
**     2020-40-12
*/
var SolidHandler = function(){

var self = this
self.log = function(msg){console.log(msg) }

this.isSolsideHome = function(url){
    if( url==="https://solside.solidcommunity.net/public/index.html"
     || url==="https://solside.solidcommunity.net/public/"
     || url==="https://solside.solidcommunity.net/public"
     ){ return true }
}
this.cp = async function(from, to, mode, aclMode, agentMode, mergeMode, type){
		if (to === (this.getRoot(to)+'profile/card') || to === (this.getRoot(to)+'profile/card$.ttl')) {
			self.err = '\nedit of profile/card is not allowed in solid-ide'  // TODO 
			return false
		}
    let options = aclMode==="true" ? { withAcl: true, agent: agentMode, merge: mergeMode } : { withAcl: false,  merge: mergeMode }
    if (mode === 'copy') return await fc.copy(from, to, options)
    if (mode === 'move') return await fc.move(from, to, options)
    if (mode === 'patch') {
    	const body = await fc.readFile(from)
    	alert('patch '+to+'\n'+body+'\n'+type)
    	if (type==='application/octet-stream') type ='application/sparql-update'
    	return await fc.patchFile(to, body, type)
		}	
}

this.deleteResource = async function(url, options = { withLinks: 'include' }) {  //true }){
    // do not allow deletion of pod profile/card (since you cannot recreate it)
	if (url === (this.getRoot(url)+'profile/card')) {
      self.err = '\ndelete of profile/card is not allowed'
      return false
	}
	 // if (options.withLinks === 'include') return await fc.deleteFile(url)  // NSS > 5.3.0
	return await fc.delete(url)
}

this.createResource = async function(url,content,linkOwner) {
  self.err = ''
	let contentType = window.mime.getType(url)
  alert('contentType ' + contentType + window.mime.getType('text.md'))
	if(!content)  content = contentType.includes('json') ? "{}" : ""
	// if no extension 'application/octet-stream' is default and not anymore 'text/turtle'
	if (url === (this.getRoot(url)+'profile/card')) {
		self.err = '\nedit of profile/card is not allowed in solid-ide'  // TODO 
		return false
	}
  if (url.endsWith('.acl') || url.endsWith('.meta') || url.endsWith('/profile/card')) contentType = 'text/turtle'
  if (contentType === 'text/turtle') content = await self.isValidTtl(url, content, linkOwner)

  if (self.err) return false
  return await fc.createFile(url,content,contentType)
}

this.isValidTtl = async function(url, content, linkOwner) {
  self.err = ''
  let isValid
	if (url.endsWith('.acl')) {
		if (!content) {
			content = await fc.aclUrlParser(linkOwner)
				.then(agents => fc.acl.createContent(linkOwner, agents))
	  } else {
	  	content = await fc.acl.contentParser(linkOwner, content)
	  	  .then(agents => fc.acl.createContent(linkOwner, agents))
	  }
    const options = { aclMode: 'Read', aclDefault: 'must' } // aclMode: 'Control'
	  isValid = await fc.isValidAcl(linkOwner, content, options)
  }
  else isValid = await fc.isValidRDF(url, content)

	if (isValid.err.length) {
		self.err =`\n\nError :\n  ${isValid.err.join('\n  ')}`
		if (isValid.info.length) self.err = self.err.concat(`\n\nFor information:\n  ${isValid.info.join('\n  ')}`)
	}
	self.info = ''
	if (isValid.info.length) self.info = `\n\nFor information :\n  ${isValid.info.join('\n  ')}`
	return content
}

this.getAclInherit = async (url, toName) => {
	for (i=1; i<url.split('/').length; i++) {
  	const links = await fc.getItemLinks(url, { links: 'include' }) //, withAcl: true, withMeta: false })
  	if (links.acl) { //await self.getAclInherit(self.getParentUrl(url), toName)
     	let aclContent = await fc.readFile(links.acl)
      aclContent = fc.makeAclContentRelative(aclContent, url, toName, { agent: 'no_modify' })
      aclContent = aclContent.replace(new RegExp('<./>', 'g'), '<./' + toName + '>')
	    return aclContent
  	}
  	url = self.getParentUrl(url)
	}
}


this.rm = async function(url) {
	if (url.endsWith('/')) { return await fc.deleteFolder(url) }
	return self.deleteResource(url)
}
this.add = async function(parentFolder,newThing,type,linkOwner) {
//    var filetype;
    var content
    if(type==='folder') return fc.createFolder(parentFolder+newThing)
    else return self.createResource(parentFolder+newThing,content,linkOwner)
}
this.get = async function(thing) {
    self.err = ''
    let options = {}
    self.qname="";
    thing = thing || self.urlFromQueryString()  // TBD self.... may be undefined
    if(typeof(thing)==='string') thing = { url:thing }
    if(! thing.type) {
      thing.type = thing.url.endsWith('/') ? "folder" : window.mime.getType(thing.url)
      if (thing.url.endsWith('.acl') || thing.url.endsWith('.meta')) { thing.type = 'text/turtle' }

    }
    self.log("got a "+thing.type)

    // return folder resource
    if( thing.type==="folder" ) {
      let folder = await fc.readFolder(thing.url, options)
	    .catch(e => { self.err = JSON.stringify(e) })
      if (self.err) { return false}
      // add permissions and links
      folder = await this.addPermsAndLinks(folder)
      folder.files.map( async item => [item, ...[await this.addPermsAndLinks(item)]].flat())
      // add folder content
      var response = await fc.fetch(thing.url, { headers: { "Accept": "text/turtle" }})
	    if(!response.ok){ self.err=fc.err; return false }
	    var body = await response.text()
      folder.content = body
		  self.checkForIndex( folder );
		  // add folder parent
      let parentOK=folder.parent.replace('https://','').replace(/^[^/]*/,'')
      if( parentOK ){
          folder.folders.unshift({
            type : "folder",
            url : folder.parent,
            name : ".."
          })
      }
		return {"key":"folder", "value":folder }
    }

    // return file ressource
    else {
      self.err = ''
	    let body = await fc.readFile(thing.url)
	        .catch(e => {self.err = JSON.stringify(e) })
      if (self.err) { return false }
	    return('file',{key:"file",value:{
            type:thing.type,
            content:body,
            url:decodeURI(thing.url),
            perms:thing.perms
        }})
    }
}

this.addPermsAndLinks = async function (item) {
	// .meta.acl is not added
	let options = {}
  item['perms'] = await this.checkPerms(item.url)
  if (app.displayLinks ===  'include') {
    options.links = 'include'
    options.withAcl = true
  	if (!item.perms.Control) { options.withAcl = false }
  	item['links'] = await fc.getItemLinks(item.url, options)
  }
  return item
}

/* SESSION MANAGEMENT
*/
this.checkPerms = async function (url) {
    let perms = { Read: false, Write: false, Append:false, Control:false }
    //let strHead = await fc.readHead(url)
    // alert(strHead)
    let head = await fc.head(url)
    let acl = head.headers.get('wac-allow')
    if (typeof acl !== 'string') {
        head = await fc.head(self.getParentUrl(url))
        acl = head.headers.get('wac-allow')
    }
    let mode = ["Read","Write","Append","Control"]
    mode.forEach(element => {
        if (acl.split(',')[0].includes(element.toLowerCase())) perms[element] = true
    })
    // alert('permissions ' + url + '\n' + JSON.stringify(perms))
    return perms
}

this.checkStatus = async function(url){
   var sess = await ss.checkSession()
   var webId    = (sess) ? sess : ""
   var loggedIn = (sess) ? true : false
   var perms = await self.checkPerms(url,webId)

   return { 
                webId:webId,
//                storage:storage,
                loggedIn:loggedIn,
                permissions:perms 
          }
}
/* INTERNAL FUNCTIONS
*/
this.checkForIndex = function( folder ){
   self.hasIndexHtml = false
   for(f in folder.files){
       if( folder.files[f].name==="index.html" ) {
           self.hasIndexHtml = true;
           break;
       }
   }
}
this.urlFromQueryString = function(){
    var thing = self.parseQstring();

    // admin param deprecated
    const param = 'admin'
    const res = ['true', 'false'].find(element => element === thing[param])
    if (res) {
        let state = app.getStoredPrefs()
        if (state) {
            app[param] = state[param] = thing[param] // === 'true' ? true : false
            if (thing[param] === 'false') { app.displayLinks = 'exclude' } // state.links = 'exclude' }
            localStorage.setItem("solState", JSON.stringify(state))
        }
    }
    else if (thing[param] !== undefined) alert('admin param should be = true/false')
    
    // url param
    if(thing.url !== undefined && thing.url !== 'undefined') {
        self.qname = thing
        var name   = thing.url.substring(thing.url.lastIndexOf('/')+1);
        var folder = thing.url.replace(name,'')
        thing = {
             url : folder,
            type : "folder"
        }
        self.qname = thing
    }
    else {
        thing = {
             url : sol.homeUrl ? sol.homeUrl : "https://solside.solidcommunity.net/public/samples/",
            type : "folder"
        }
    }
    return thing
}
this.parseQstring = function() {            
    var pairs = location.search.slice(1).split('&');
    var result = {};
    pairs.forEach(function(pair) {
        pair = pair.split('=');
        result[pair[0]] = decodeURIComponent(pair[1] || '');
    });
    return result;
}
this.getRoot = url => {
  const base = url.split('/')
  let rootUrl = base[0]
  let j = 0
  for (let i = 1; i < base.length - 1; i++) {
    j = i
    if (base[i] === '') { rootUrl += '/' }
    break
  }
  rootUrl = rootUrl + '/' + base[j + 1] + ('/')
  return rootUrl
}
this.getParentUrl = url => {
  url = this.removeSlashesAtEnd(url)
  return url.substring(0, url.lastIndexOf('/') + 1)
}
this.getItemName = url => {
  url = self.removeSlashesAtEnd(url)
  return url.substr(url.lastIndexOf('/') + 1)
}
this.removeSlashesAtEnd = url => {
  while (url.endsWith('/')) {
    url = url.slice(0, -1)
  }
  return url
}

return this
}
if (typeof(module)!="undefined" )  module.exports = solidAuthSimple()
/* END */
