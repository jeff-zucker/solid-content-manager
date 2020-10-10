/* VERSION 1.1.0
**     2020-07-28
*/
var SolidHandler = function(){

var self = this
self.log = function(msg){console.log(msg) }

this.isSolsideHome = function(url){
    if( url==="https://solside.solidcommunity.net/public/index.html"
     || url==="https://solside.solidcommunity.net/public/"
     || url==="https://solside.soliidcommunity.net/public"
     ){ return true }
}
this.cp = async function(from, to, mode, aclMode, agentMode, mergeMode, type){
		if (to === (this.getRoot(to)+'profile/card') || to === (this.getRoot(to)+'profile/card$.ttl')) {
			self.err = '\nedit of profile/card is not allowed in solid-ide'  // TODO 
			return false
		}
    let options = aclMode==="true" ? { withAcl: true, agent: agentMode, merge: mergeMode } : { withAcl: false,  merge: mergeMode }
//    let options = { withAcl: aclMode, agent: agentMode, merge: mergeMode }
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
/*    if (url.endsWith('.acl') || url.endsWith('.meta')) {
      self.err = "\nacl or meta can't be modified/created by solid-ide, use the databrowser"
      return false
    }
*/
	 // if (options.withLinks === 'include') return await fc.deleteFile(url)  // NSS > 5.3.0
	return await fc.delete(url)
}
// if no extension or unknown will default to .ttl (to be updated) - beware with .acl and .meta
this.createResource = async function(url,content,linkOwner) {
  self.err = ''
	let contentType = window.Mimer(url) // fc.guessFileType(url)
	if(!content)  content = contentType === 'application/json' ? content = "{}" : ""  // replace "file" not allowed for .meta
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
/*  var isValidTtl = { err: [], info: [] }
	if (url.endsWith('.acl')) {
	  if (!content) content = self.defaultAcl(url, app.webId)
		isValidTtl = await fc.isValidAcl(url, content, app.webId)
		// check for relative notation
		if (content.includes(url.split('.acl')[0]) || content.includes(self.getRoot(url)+'profile/card#')) {
			isValidTtl.info = isValidTtl.info.concat(`you could use relative notation`)
		}
	}
	else isValidTtl = await fc.isValidRDF(url, content)
*/
	
	if (url.endsWith('.acl')) {
		if (!content) {
// alert('linkOwner '+linkOwner)
       /*const agents = await fc.aclUrlParser(linkOwner)
alert('inherited agents '+JSON.stringify(agents))
       content = await fc.acl.createContent(linkOwner, agents)*/
			content = await fc.aclUrlParser(linkOwner)
				.then(agents => fc.acl.createContent(linkOwner, agents))
    //alert('inherited '+content)
		//content = self.defaultAcl(url, app.webId)
//		content = await self.getAclInherit(url, self.getItemName(url).split('.acl')[0]) // self.defaultAcl(url, app.webId)
	  } else {
	  	content = await fc.acl.contentParser(linkOwner, content)
	  	  .then(agents => fc.acl.createContent(linkOwner, agents))
	  }
// create a rule
let aclUsers = await fc.acl.addUserMode({}, [{ agentClass: 'Agent' }], ['Read'])
// add an other rule
aclUsers = await fc.acl.addUserMode(aclUsers, [{ agent: 'https://example.soliidcommunity.net/profile/card#me' }], ['Read', 'Write', 'Control'])

// build the aclContent
//const aclContent = await fc.acl.createContent('https://example.soliidcommunity.net/public/text.txt', aclUsers)
//console.log('build an aclContent ' + aclContent)
// test create acl
//aclUsers = await fc.aclUrlParser(url)
/*let aclUsers = await fc.aclContentParser('test', content)
alert('source aclUsers '+JSON.stringify(aclUsers))
let aclContent = await fc.aclCreate(linkOwner, aclUsers)
alert('source aclContent '+aclContent)
*/
aclUsers = await fc.acl.addUserMode({}, [{ agentClass: 'AuthenticatedAgent' }], ['Append'])
aclUsers = await fc.acl.addUserMode(aclUsers, [{ agentClass: 'AuthenticatedAgent' }], ['Append', 'Read'])
aclUsers = await fc.acl.addUserMode(aclUsers, [{ agent: '/profile/card#me' }], ['Control', 'Read', 'Write'])
aclUsers = await fc.acl.addUserMode(aclUsers, [{ origin: 'http://127.0.0.1:8080' }], ['Control', 'Read', 'Write'])
aclUsers = await fc.acl.addUserMode(aclUsers, [{ origin: 'https:scenaristeur.github.io' }], ['Control', 'Read', 'Write'])

alert('add aclUsers new '+JSON.stringify(aclUsers))
aclContent = await fc.acl.createContent(linkOwner, aclUsers)
console.log(aclContent)
alert(aclContent)
/*alert('add aclContent new content '+aclContent)
aclUsers = await fc.aclAddUserMode(aclUsers, [{ agentClass: 'Agent' }, { origin: 'https://soliidcommunity.net' }, { default: '' }], ['Append', 'Write'])
alert('add aclUsers add everybody & origin & default '+JSON.stringify(aclUsers))
aclContent = await fc.aclCreate(linkOwner, aclUsers)
alert('add aclContent with everybody & origin '+aclContent)
aclUsers = await fc.aclDeleteUserMode(aclUsers, [{ agentClass: 'Agent'}], ['Write'])
alert('delete aclUsers delete everybody'+JSON.stringify(aclUsers))
aclContent = await fc.aclCreate(linkOwner, aclUsers)
alert('delete aclContent delete everybody write'+aclContent)
aclUsers = await fc.aclDeleteUserMode(aclUsers, [{ agentClass: 'Agent'}, { default: '' }])
alert('remove user everybody & default '+JSON.stringify(aclUsers))
aclContent = await fc.aclCreate(linkOwner, aclUsers)
alert('remove aclUser everybody & default '+aclContent)
isValid = await fc.isValidTtl(url, content, app.webI, { aclAuth: 'Control' })
alert('tests '+ JSON.stringify(isValid))
//
*/
    const options = { aclMode: 'Control', aclDefault: 'must' }
	  isValid = await fc.isValidAcl(linkOwner, content, options) // TODO isValidAcl with linkOwner
  }	//const isValid = { err: [isValidTtl.err], info: [isValidTtl.info] }
  else isValid = await fc.isValidRDF(url, content) // TODO isVAlidRDF

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
  ##    acl:origin <https://pod.soliidcommunity.net>  # trusted app/agent bot
 # - the accessTo resource
  ##    acl:accessTo <${accessTo}>;
 # - for a folder an acl:default
  ##    acl:default </>;
 # - a combination of authorization : Read/Append/Write/Control
  ##    acl:mode acl:Read, acl:Write.
`
	return contentAcl
}

this.aclUrlParser = async (url) => {
  const target = self.getItemName(url)
  // const { acl: aclUrl } = fc.getItemLinks(url, { links: 'include_possible' })
  const max = url.substring(self.getRoot(url).length-2).split('/').length
//alert('max '+max)
  for (let i = 1; i < max; i++) {
    try {
//alert('url '+target+' '+url)
     url = self.getParentUrl(url)
	    const links = await fc.getItemLinks(url, { links: 'include' }) //, withAcl: true, withMeta: false })
//alert('links.acl '+links.acl)
	    if (links.acl) {
alert('url '+url+'\n'+JSON.stringify(links))
	      let aclContent = await fc.readFile(links.acl)
	      aclContent = fc.aclMakeContentRelative(aclContent, url, target, { agent: 'no_modify' })
	      if (target) aclContent = aclContent.replace(new RegExp('<./>', 'g'), '<./' + target + '>')
alert(aclContent)
	      return self.aclContentParser(url, aclContent)
	    } 
//	    return aclContent}
    } catch(e) {}
  }
}

this.aclContentParser = async function (aclUrl, content) {
  const acl = 'http://www.w3.org/ns/auth/acl#'
  const foaf = 'http://xmlns.com/foaf/0.1/'

  // find all predicates
  const resAcl = await fc.rdf.queryTurtle(aclUrl, content)
alert('resAcl '+JSON.stringify(resAcl))
  if (!resAcl.length) { self.err = 'not an acl content'; return }

  // build acl users predicate list
  const aclList = {}
  for (const i in resAcl) {
    const aclItem = resAcl[i].predicate.value
    let excludes = ['accessTo', 'default', 'mode', 'defaultForNew'] // defaultForNew is deprecated
    const exclude = excludes.find(element => aclItem.includes(element))
    if (aclItem.includes(acl) && !exclude) aclList[aclItem.split('#')[1]] = ''
  }
  const aclPred = Object.keys(aclList)
alert('aclPred '+JSON.stringify(aclPred))
  // forEach predicate acl:
 	let users = {}
  for (const i in aclPred) {
    const user = await fc.rdf.query(aclUrl, null, { acl: aclPred[i] }) 
    for (const j in user) {
	    let object = user[j].object.value
	    if (object.includes(foaf)) object = object.split(foaf)[1]
      const key = aclPred[i]+'&'+object
      if (!users[key]) {
        users[key] = {
        	mode: { Read: 0, Append: 0, Write: 0, Control: 0 },
        	agent: { predicate: aclPred[i], object: object }
        }
      }

	    // forEach object mode acl: xxx
      const mode = await fc.rdf.query(aclUrl, user[j].subject, { acl: 'mode' })
	    for (const k in mode) {
	    	const aclMode = mode[k].object.value.split('#')[1]
	    	let testMode = {}
        testMode[aclMode] = 1
        let test = Object.assign(users[key].mode, testMode) //{ mode: { Read: false, Append: false, Write: false, Control: false} }
	    } // end k
    } // end j
  } // end i
  return users
}

this.aclCreate = async function (url, aclUsers) {
  let aclSubject = {}
  // check if acl:default has already been managed
  // there is at least one rule with acl:default in a document acl
  let addAclDefault = true
  if (aclUsers['default&']) {
  		if (url.endsWith('/')) addAclDefault = false
  		else { delete aclUsers['default&'] }
  }
  // build sort key and key values
  for (const user in aclUsers) {
  	let i = 1
  	let keyValue = 0
  	let keySubject = ''
  	let keyMode = `n0:mode`
  	for (const j in aclUsers[user]['mode']) {  		
  	  keyValue = keyValue + aclUsers[user]['mode'][j]*i
  	  i = i*2
  	  if (aclUsers[user]['mode'][j]) {
  	  	keySubject = keySubject + j
  	  	keyMode = keyMode + ' n0:' + j + ','
  	  }
  	}
  	if (keyValue) {
	  	aclUsers[user]['key'] = keyValue
	  	keyMode = keyMode.substring(0, keyMode.length-1) + '.'
	  	aclSubject[keyValue] = { subject: keySubject, mode: keyMode }
  	}
  }
  // TODO error on aclSubject
//  if (aclSubject[0] === undefined) { alert( 'no aclContent : no users and/or no mode for users'); return } TODO

  //build prefix
  let target = self.getItemName(url)
  target = target === '' ? './' : target
  let aclContent = `
@prefix : <#>.
@prefix n0: <http://www.w3.org/ns/auth/acl#>.
@prefix target: <${target}>.
@prefix n1: <http://xmlns.com/foaf/0.1/>.
`
  // forEach key.value build an acl block
  for (i in aclSubject) {
  	const aclName = aclSubject[i].subject
  	let aclBlock ='\n' + `:${aclName}`
  	    + '\n    a n0:Authorization;'
  	    + '\n    n0:AccessTo target:;'
  	for (j in aclUsers) {
  		if (aclUsers[j].key.toString() === i) {
        const item = j.split('&')
  			let predicate = 'n0:' + item[0]
  			let object = item[1]
  			if (object === 'Agent') object = 'n1:' + object
  			else if (object === 'AuthenticatedAgent') object = 'n0:' + object
  			else if (item[0] === 'default') object = 'target:'
  			else object = '<'+object+'>'
  		  aclBlock = aclBlock + '\n' + `    ${predicate} ${object};`
  		}
  	}
		if (url.endsWith('/') && addAclDefault) aclBlock = aclBlock + `\n    n0:default target:;`
		aclBlock = aclBlock + `\n    ${aclSubject[i].mode}` + '\n'
		aclContent = aclContent + aclBlock
  }
  aclContent = fc.makeAclContentRelative(aclContent, url, target, { agent: 'to_target' })

  return aclContent
}

this.aclAddUserMode = async function (aclUsers, userAgent, userMode) {
	// TODO test userAgent & userMode
	if (!Array.isArray(userAgent) || !Array.isArray(userMode)) { self.err = 'should be array parameters'; return }
	const aclModes = ['Read', 'Append', 'Write', 'Control']
	const aclPredicates = ['agent', 'agentClass', 'agentGroup', 'origin', 'default']
	if (userAgent.length) {
		for (j in userAgent) {
			const predicate = Object.keys(userAgent[j])
			if (!aclPredicates.find(item => item === predicate[0])) { self.err = 'Error in userAgent.predicate'; return }
			let user = predicate[0]+'&'+userAgent[j][predicate[0]] //(userAgent.predicate+'&'+userAgent.object
			if (predicate[0] === 'default') user = predicate[0]+'&'
		  if (!aclUsers[user]) {
		    aclUsers[user] = { mode: { Read: 0, Append: 0, Write: 0, Control: 0 } }
		  }
		  if (userMode.length) {
				let addMode = {}
				for (i in userMode) {
		//alert('mode '+userMode.mode[i])
				  if (!aclModes.find(item => item === userMode[i])) { self.err = 'mode ' + i + ' is not allowed (Read, Append, Write, Control)'; return }
					addMode[userMode[i]] = 1
		//alert('addMode '+JSON.stringify(addMode))
				}
				let test = Object.assign(aclUsers[user]['mode'], addMode)
		
	// alert('aclUsers '+JSON.stringify(aclUsers))
	//		return aclUsers
		  } else { self.err = 'You must provide the modes to add'; return }
		}
		return aclUsers
	}
	self.err = 'You must provide the userAgent as an array of objects'
}

this.aclDeleteUserMode = async function (aclUsers, userAgent, userMode) {
	const aclModes = ['Read', 'Append', 'Write', 'Control']
	const aclPredicates = ['agent', 'agentClass', 'agentGroup', 'origin', 'default']
	if (userAgent.length) {
		for (j in userAgent) {
		const predicate = Object.keys(userAgent[j])
  	if (!aclPredicates.find(item => item === predicate[0])) { self.err = 'Error in userAgent.predicate'; return }
			let user = predicate[0]+'&'+userAgent[j][predicate[0]] //(userAgent.predicate+'&'+userAgent.object
			if (predicate[0] === 'default') user = predicate[0]+'&'
	    let keyValue = 0
alert('delete '+user+JSON.stringify(userMode))
      if (aclUsers[user]) {
  	    if (userMode) {
			    for (i in userMode) {
				    if (!aclModes.find(item => item === userMode[i])) { self.err = 'mode ' + i + ' is not allowed (Read, Append, Write, Control)'; return }
				    let addMode = {}
				    addMode[userMode[i]] = 0
			      let test = Object.assign(aclUsers[user]['mode'], addMode)
			    }
	  	    for (const j in aclUsers[user]['mode']) {  		
	  	      keyValue = keyValue + aclUsers[user]['mode'][j]*i
	  	      i = i*2
	  	    }
  	    }
  	    if (!keyValue) delete aclUsers[user]
      }
	  }
    return aclUsers
  }
  self.info = 'There is no user to delete'
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
      thing.type = thing.url.endsWith('/') ? "folder" : window.Mimer(thing.url)
      if (thing.url.endsWith('.acl') || thing.url.endsWith('.meta')) { thing.type = 'text/turtle' }

    }
    self.log("got a "+thing.type)
    if( thing.type==="folder" ) {
// alert('get '+app.logState+' '+app.perms.Control+' '+' '+app.webId+' '+app.loggedIn+' '+this.loggedIn+' '+app.displayLinks+' '+app.links)
/*			if (!app.perms.Control && app.displayLinks === 'include') {
				return alert('You do not have authorization "Control" for "displayLinks = include"')
			}
*/
//      options.links = app.displayLinks  //=== 'include' ? 'include' :'include_possible'  // app
      let folder = await fc.readFolder(thing.url, options)
	    .catch(e => { self.err = JSON.stringify(e) })
      if (self.err) { return false}
      // add permissions and links
      folder = await this.addPermsAndLinks(folder)
      folder.files.map( async item => [item, ...[await this.addPermsAndLinks(item)]].flat())
      // add folder content
      var response = await fc.fetch(thing.url, { headers: { "Accept": "text/turtle" }})   // await fc.fetch
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
// alert(JSON.stringify(folder))      
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
            url:decodeURI(thing.url),
            perms:thing.perms   // add permissions (TODO is it needed to display a limited fileManager)
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
this.checkPerms = async function (url) { // ,agent,session) {
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
// alert(url+'\n'+acl+'\n'+JSON.stringify(perms))
//    if(perms.Control === true) return perms
    return perms
}

    /* I have a version of this that does a recursive ACL check
    ** but it's not ready for prime time yet, so we do this kludge instead
    */
/*    if(!agent || !url)
        /* No harm in this, the interface will show a message if the
        ** user doesn't actually have read perms
        */ 
/*        return { Read:true, Write:false, Control:false  }
    if(!self.storage){
        var path = agent.replace(/^https:\/\/[^/]*\//,'')
        self.storage = agent.replace(path,'')
    }
    if( self.storage && url.match(self.storage) && !url.match('profile/card') )   // if
        return { Read:true, Write:true, Control:true  }
    else
        return { Read:true, Write:false, Control:false  }
}
*/

this.checkStatus = async function(url){
   var sess = await ss.checkSession()
   var webId    = (sess) ? sess : ""
   var loggedIn = (sess) ? true : false
   var perms = await self.checkPerms(url,webId)

// alert('webId '+webId)
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
             url : sol.homeUrl ? sol.homeUrl : "https://solside.soliidcommunity.net/public/samples/",
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
