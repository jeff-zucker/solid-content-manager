/* VERSION 1.0.0
**     2020-01-10
*/
var SolidHandler = function(){

var self = this
self.log = function(msg){console.log(msg) }

this.isSolsideHome = function(url){
    if( url==="https://solside.solid.community/public/index.html"
     || url==="https://solside.solid.community/public/"
     || url==="https://solside.solid.community/public"
     ){ return true }
}
this.cp = async function(from, to, mode, acl, agentMode, mergeMode){
    let options = acl==="true" ? { withAcl: true, agent: agentMode, merge: mergeMode } : { withAcl: false,  merge: mergeMode }
    if (mode === 'copy') return await fc.copy(from, to, options)
    if (mode === 'move') return await fc.move(from, to, options)
}
this.deleteResource = async function(url, options = { withLinks: true }){
    // do not allow deletion of pod profile/card (since you cannot recreate it)
	if (url.match('profile/card')) {
      self.err = '\ndelete of profile/card is not allowed'
      return false
	}
/*    if (url.endsWith('.acl') || url.endsWith('.meta')) {
      self.err = "\nacl or meta can't be modified/created by solid-ide, use the databrowser"
      return false
    }
*/
	if (options.withLinks) return await fc.deleteFile(url)
	return await fc.delete(url)
}
// if no extension or unknown will default to .ttl (to be updated) - beware with .acl and .meta
this.createResource = async function(url,content) {
  self.err = ''
	let contentType = window.Mimer(url) // fc.guessFileType(url)
	if(!content)  content = contentType === 'application/json' ? content = "{}" : ""  // replace "file" not allowed for .meta
	// if no extension 'application/octet-stream' is default and not anymore 'text/turtle'
/*	if (url.match('profile/card')) {
		self.err = '\nedit of profile/card is not allowed in solid-ide'  // TODO
		return false
	}
*/
  if (url.endsWith('.acl') || url.endsWith('.meta')) contentType = 'text/turtle'
  if (contentType === 'text/turtle') content = await self.isValidTtl(url, content)

  if (self.err) return false
  return await fc.createFile(url,content,contentType)
}

this.isValidTtl = async function(url, content) {
  self.err = ''
  var isValidTtl = { err: [], info: [] }
	if (url.endsWith('.acl')) {
	  if (!content) content = self.defaultAcl(url, app.webId)
		isValidTtl = await fc.isValidAcl(url, content, app.webId)
		// check for relative notation
		if (content.includes(url.split('.acl')[0]) || content.includes(self.getRoot(url)+'profile/card#')) {
			isValidTtl.info = isValidTtl.info.concat(`you could use relative notation`)
		}
	}
	else isValidTtl = await fc.isValidRDF(url, content)

	if (isValidTtl.err.length) {
		self.err =`\n\nError :\n  ${isValidTtl.err.join('\n  ')}`
		if (isValidTtl.info.length) self.err = self.err.concat(`\n\nFor information:\n  ${isValidTtl.info.join('\n  ')}`)
	}
	self.info = ''
	if (isValidTtl.info.length) self.info = `\n\nFor information :\n  ${isValidTtl.info.join('\n  ')}`
	return content
}

this.defaultAcl = (url, webId) =>	{
	var card = `/profile/card#`
	let agent = webId.includes(card) ? `c:me` : `<${webId}>`
	const accessTo = `./${self.getItemName(url).split('.acl')[0]}`
	let resource = `<${accessTo}>;   # accesst to the resource`
	if (url.endsWith('/.acl')) {
	resource = '<./>;   # access to the resource\n'
	+'    acl:default <./>;   # All resources will inherit this authorization, by default'
	}
	var contentAcl = `# Example of default ACL resource
@prefix : <#>.
@prefix c: <${card}>.
@prefix acl: <http://www.w3.org/ns/auth/acl#>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.
# @prefix tes: <../address/Group/test.ttl#>.   # example of vcard group

# Readable by the public
:public
    a acl:Authorization;   # acl type authorization
    acl:agentClass foaf:Agent;   # everybody
    acl:accessTo ${resource}
    acl:mode acl:Read.   # only Read authorization

# Owner has full access to every resource in the folder.
# Other agents have no access rights, unless specifically authorized.
:owner
    a acl:Authorization;
    acl:agent ${agent};   # agent's webId
    acl:accessTo ${resource}
    acl:mode acl:Read, acl:Write, acl:Control.   # The owner has all of the access modes allowed
    
# help : an acl block is composed of :
 # - a rdf authorization
  ## :ReadWrite
 # - a combination of one or more agent/agentClass/group/origin
  ##    acl:agent c:me;                           # agent
  ##    acl:agentClass foaf:Agent;                # everybody
  ##    acl:agentClass acl:AuthenticatedAgent     # logged in agent
  ##    acl:agentGroup tes:this                   # group
  ##    acl:origin <https://pod.solid.community>  # trusted app/agent bot
 # - the accessTo resource
  ##    acl:accessTo <${accessTo}>;
 # - for a folder an acl:default
  ##    acl:default </>;
 # - a combination of authorization : Read/Append/Write/Control
  ##    acl:mode acl:Read, acl:Write.
`
	return contentAcl
}

this.rm = async function(url) {
	if (url.endsWith('/')) { return await fc.deleteFolder(url) }
	return self.deleteResource(url)
}
this.add = async function(parentFolder,newThing,type,content) {
//    var filetype;
    if(type==='folder') return fc.createFolder(parentFolder+newThing)
    else return self.createResource(parentFolder+newThing,content)
}
this.get = async function(thing) {
    self.err = ''
    let options = {}
    self.qname="";
    thing = thing || self.urlFromQueryString()  // TBD self.... may be undefined
    if(typeof(thing)==='string') thing = { url:thing }
    if(! thing.type) {
      thing.type = thing.url.endsWith('/') ? "folder" : window.Mimer(thing.url)
      if (thing.url.endsWith('.acl') || thing.url.endsWith('.meta')) { thing.type = 'text/turtle' }

    }
    self.log("got a "+thing.type)
    if( thing.type==="folder" ) {
      options.links = app.displayLinks  //=== 'include' ? 'include' :'include_possible'  // app
      let folder = await fc.readFolder(thing.url, options)
	    .catch(e => { self.err = JSON.stringify(e) })
      if (self.err) { return false}
      var response = await fc.fetch(thing.url, { headers: { "Accept": "text/turtle" }})   // await fc.fetch
	    if(!response.ok){ self.err=fc.err; return false }
	    var body = await response.text()
      folder.content = body
		  self.checkForIndex( folder );
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

    else {
        self.err = ''
	    let body = await fc.readFile(thing.url)
	        .catch(e => {self.err = JSON.stringify(e) })
        if (self.err) { return false }
	    return('file',{key:"file",value:{
            type:thing.type,
            content:body,
            url:decodeURI(thing.url)
        }})
    }
}

/* SESSION MANAGEMENT
*/
this.checkPerms = async function(url,agent,session){
    let perms = { Read: false, Write: false, Append:false, Control:false }
let strHead = await fc.readHead(url)
// alert(strHead)
    let head = await fc.head(url)
    // this is a hack for NSS issue ???? (podRoot/index.html)
// head.headers.get('wac-allow')
// alert(user+public)
// return perms
    let acl = head.headers.get('wac-allow')
    if (typeof acl !== 'string') {
        head = await fc.head(self.getParentUrl(url))
        acl = head.headers.get('wac-allow')
    }
    let mode = ["Read","Write","Append","Control"]
    mode.forEach(element => {
        if (acl.split(',')[0].includes(element.toLowerCase())) perms[element] = true
    })
// alert(url+acl+JSON.stringify(perms))
    if(perms.Control === true) return perms


    /* I have a version of this that does a recursive ACL check
    ** but it's not ready for prime time yet, so we do this kludge instead
    */
    if(!agent || !url)
        /* No harm in this, the interface will show a message if the
        ** user doesn't actually have read perms
        */ 
        return { Read:true, Write:false, Control:false  }
    if(!self.storage){
        var path = agent.replace(/^https:\/\/[^/]*\//,'')
        self.storage = agent.replace(path,'')
    }
    if( self.storage && url.match(self.storage) && !url.match('profile/card') )   // if
        return { Read:true, Write:true, Control:true  }
    else
        return { Read:true, Write:false, Control:false  }
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
    // admin param
    const param = 'admin'
    const res = ['true', 'false'].find(element => element === thing[param])
    if (res) {
        let state = app.getStoredPrefs()
        if (state) {
            app[param] = state[param] = thing[param] // === 'true' ? true : false
            if (thing[param] === 'false') { app.displayLinks = state.links = 'exclude' }
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
             url : sol.homeUrl ? sol.homeUrl : "https://solside.solid.community/public/samples/",
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
