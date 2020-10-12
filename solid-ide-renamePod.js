/* JSZip handler VERSION 1.0.0
**     2020-04-08
*/

// TODO
// - await guessContent for zip objects : replace mimer by mime an do not use the magic nmbers
// - replace self.acl and self.err : OK
// - rewrite the links/file.acl to relativePath/file.acl 

// TESTS
// - zip
// -- links include file, folder : OK
// -- links exclude file, folder : OK
// - unzip
// -- links include
// --- file, folder, folder with bad rdf, folder with bad acl : OK
// -- links exclude
// --- file, folder : OK

var RenamePodServer = function() {

var self = this

/*this.clearCacheForFolder = (path) => cache.remove(path);
this.clearCache = () => cache.clear();
*/

  /**
   * Wrap API response for zipping multiple items
   */
this.renameURI = async (path, options) => {
    options = {
      //...zipOptions,
      links: 'include',
      ...options
    }
//    alert(path)
    const itemList = [path]
    //const zip = new JSZip()
    self.err = ''
    return self.renameItems(itemList, options) // .then(() => self.err)
    //return self.renameItems(zip, itemList, options) // path
    //  .then(() => zip)
  }

  /**
   * Add items with links to a zip object recursively
   */
//this.renameItems = async (zip, itemList, options) => {
this.renameItems = async (itemList, options) => {
      var promises = itemList.map(async item => {
      const itemName = self.getItemName(item)
      // zip folders with links
      if (item.endsWith('/')) {
        //const folderZip = zip.folder(itemName)
        if (options.links === SolidFileClient.LINKS.INCLUDE) {
          //await self.renameItemLinks(folderZip, item, options)
          await self.renameItemLinks(item, options)
        }
        try {
          const folderItems = await fc.getFolderItemList(item, { links: 'exclude' })
          //await self.renameItems(folderZip, folderItems, options)
          await self.renameItems(folderItems, options)
        } catch (err) { self.err = self.err + err}
      // zip file with links
      } else {
        /*if (this.zipSupport().blob) {
          const blob = await this.getFileBlob(item)
          zip.file(itemName, blob, { binary: true })
        } else {
          const content = this.readFile(item)
          zip.file(itemName, content, { binary: false })
        } */
        try {
          const res = await fc.get(item) //.catch(err => self.err = err.message)
          let contentType = res.headers.get('content-type').split(';')[0]
          // TODO why ???? no reason it's a bug in unzip
          // if (item.endsWith('/profile/card')) contentType = 'text/turtle'
          console.log(item, contentType)
          if (contentType === 'text/turtle') {
          const content = await res.text()
          //zip.file(itemName, content, { binary: false })
          await self.renameToFile(item, content, contentType, options)
          }
          if (options.links === SolidFileClient.LINKS.INCLUDE) {
          await self.renameItemLinks(item, options)
          }
        } catch (err) {self.err = self.err + err}
      }
    })

    return Promise.all(promises)
  }

this.renameToFile = async (item, content, contentType, options) => {
    // console.log('test '+ item + JSON.stringify(options))
    self.fileTested += 1
    let contentArray = content.split(('<'))
    let number = 0
    for (let i = 1; i < contentArray.length; i += 1) {
        let contentItem = contentArray[i].split('>')
        let res = contentItem[0].replace(new RegExp(options.source, 'g'), options.target)
        if (res !== contentItem[0]) {
            number +=1
            contentItem[0] = res
            contentArray[i] = contentItem.join('>')
        }
    }
    if (number) {
        content = contentArray.join('<')
        if (!options.testRenamePod) {
          await fc.putFile(item, content, contentType)
          console.log('put '+item)
        }
        self.number = self.number + number
        self.listRenameDoc = self.listRenameDoc.concat(item)
    }
}

  /**
   * Add item links to a zip object
   *
   * @param {object} zip
   * @param {Array} itemLinks
   * @param {string} itemName
   */
this.renameItemLinks = async (item, options) => {
    const links = await fc.getItemLinks(item, options)
    let itemLinks = [...Object.values(links)]
    if (links.meta) {
      itemLinks = [itemLinks, ...Object.values(await fc.getItemLinks(links.meta, options))].flat()
    }
    for (const i in itemLinks) {
      const itemLink = itemLinks[i]
      const { fileName, content } = await self.itemLinkContent(itemLink, item, options)
      /* if (this.zipSupport().blob) {
        // not supported by browser ???
        const blob = new Blob([content], { type: 'text/turtle' })
        zip.file(fileName, blob, { binary: true })
      } else zip.file(fileName, content, { binary: false }) */
      //zip.file(fileName, content, { binary: false })
      const res = await self.renameToFile(itemLink, content, 'text/turtle', options).catch(err => {})
    }
  }

this.itemLinkContent = async (itemLinkUrl, item, options) => {
    options = {
      agent: 'to_target',
      ...options
    }
    let content = await fc.readFile(itemLinkUrl)
    let fileName = self.getItemName(itemLinkUrl)
    // we suppose for files the links extensions (.acl .meta .meta.acl) are the same
    // and suppose that name can be different
    const itemName = item.endsWith('/') ? '' : self.getItemName(item)
    if (itemName) {
      // not sure it is needed old 5.0 problems
      const name = fileName.replace(new RegExp('.acl$'), '').replace(new RegExp('.meta$'), '')
      fileName = fileName.replace(name, itemName)
    }
    // if object values are absolute URI's, make them relative
    if (itemLinkUrl.endsWith('.acl')) {
        if(options.importPod) {
          content = content.replace(new RegExp('<' + getRootUrl(options.importPod), 'g'), '<' + getRootUrl(item))
        }
      content = fc.acl.makeContentRelative(content, item, itemName, options)
    }
    return { fileName: fileName, content: content }
  }

this.getItemName = url => {  // apiUtils
url = self.removeSlashesAtEnd(url)
return url.substr(url.lastIndexOf('/') + 1)
}

this.removeSlashesAtEnd = url => { // apiUtils
while (url.endsWith('/')) {
    url = url.slice(0, -1)
}
return url
}

return this
}  


  /**
 * Wrap API response for retrieving item list
 * // itemList is cached automatically
 * @param {String} path
 * @returns {Promise<Item[]>}
 */
/*this.getItemList = async (path, options = { links: SolidFileClient.LINKS.EXCLUDE }) => { // INCLUDE }) => {
/*  if (cache.contains(path)) {
  	let cacheList = cache.get(path)
  	return cacheList // cache.get(path)
  }    
*/
/*  const folderData = await fc.readFolder(path, options)
		.catch(e => { self.err = JSON.stringify(e) })
  if (self.err) { return false}
  let itemList = []
/*  if (options.links === SolidFileClient.LINKS.INCLUDE) {
  	itemList = [
    ...folderData.files.map(item => [item.url, ...Object.values(item.links)]).flat(),
    ...folderData.folders.map(item => item.url),
    ...Object.values(folderData.links),
		...Object.values(await fc.getItemLinks(folderData.links.meta, options)),
	  ]
  } else {
*/
/*  	itemList = [
    ...folderData.files.map(item => item.url),
    ...folderData.folders.map(item => item.url),
	  ]
//  }
	// cache.add(path, itemList)
  return itemList
}
 	
/**
 * Request API to upload the items as zip archive
 */
/*this.createZipArchive = async (path, archiveUrl, options) => {
	options = {
		links: SolidFileClient.LINKS.INCLUDE,
		...options
	}
//	self.err = ''
	if (options.links === SolidFileClient.LINKS.INCLUDE_POSSIBLE) {
		return Promise.reject(`Links option : "${SolidFileClient.LINKS.INCLUDE_POSSIBLE}", is not allowed`)
	}
	if (!archiveUrl.endsWith('.zip')) return Promise.reject(`invalid ${archiveUrl}, file must end with ".zip"`)// self.err = `invalid ${archiveUrl}`
	try {
		/*let itemList = [path]
  	// if file => getLinks
  	if (!path.endsWith('/') && (options.links === SolidFileClient.LINKS.INCLUDE)) {
  		itemList = [path, ...Object.values(await fc.getItemLinks(path, options))].flat()
  	}*/

/*	  return self.getAsZip(path, options)
		.then(zip => zip.generateAsync({ type: 'blob' }))
	  .then(blob => fc.createFile(archiveUrl, blob, 'application/zip'))

  } catch(err) {
  	return err
  }
}
		
this.zipItemLinks = async (zip, itemLinks, itemName) => {
	itemLinks.map(async file => {
		const blob = await self.getFileBlob(file)
		let fileName = self.getItemName(file)
		// Suppose for files the links extensions (.acl .meta .meta.acl) are the same
		if (itemName) {
			const name = fileName.replace(new RegExp('.acl$'), '').replace(new RegExp('.meta$'), '')
			const name1 = name.replace(new RegExp('.meta$'), '')
			fileName = fileName.replace(name, itemName)
		}
    const zipFile = await zip.file(fileName, blob, { binary: true })
  })
}

/**
 * Wrap API response for extracting a zip archive
 */
/*this.extractZipArchive = async (file, destination, webId, options) => {
	options = {
		links: SolidFileClient.LINKS.INCLUDE,
    merge: SolidFileClient.MERGE.KEEP_TARGET,
		...options
	}
	self.err = ''
	self.acl = { err: [], info: []}
	try {
		const blob = await self.getFileBlob(file)
    const zip = await JSZip.loadAsync(blob)
    // seems to be needed else we loose one item
    // use default options : create if not exist, keep folder content
//		await fc.createFolder(destination)
		let responses = []
		let res = await self.uploadExtractedZipArchive(zip, destination, '', webId, responses, options)
    let results = self.flattenObj(res, 'link')
		return results

  } catch (err) {
    self.err = err
  }
}

this.flattenObj = (obj, parent, res = {}) => {
	//flattenObj
	let item
  for(let key in obj){
    let propName = parent ? parent + '_' + key : key;
    if(typeof obj[key] == 'object'){
      self.flattenObj(obj[key], propName, res);
    } else {
    	item = propName.includes('err') ? { err: obj[key] } : { info: obj[key] }
      res[propName] = item // obj[key];
    }
  }
  // filter err and info with no doublons
	let filter = Object.values(res).filter(item => item.err).map(item => item.err)
	const err =  Array.from(new Set(Object.values(filter)))
	filter = Object.values(res).filter(item => item.info).map(item => item.info)
	const info =  Array.from(new Set(Object.values(filter)))
  
  return { err: err, info: info }// Array.from(new Set(Object.values(res))) // res; // Object.values(res)
}

/**
 * Recursively upload all files and folders from an extracted zip archive
 */
/*this.uploadExtractedZipArchive = async (zip, destination, curFolder = '', webId, responses, options) => { // responses
	options = {
		links: SolidFileClient.LINKS.INCLUDE,
    merge: SolidFileClient.MERGE.KEEP_TARGET,
		...options
	}
	let zipItems = await self.getItemsInZipFolder(zip, curFolder) // , responses, options)
	zipItems = (options.links === SolidFileClient.LINKS.INCLUDE) ? zipItems
		: zipItems.filter(item => (!item.name.endsWith('.acl') && !item.name.endsWith('.meta')))
	console.log('zipItems ' +options.links+'\n'+ JSON.stringify(zipItems.map(item => item.name)))
  const promises = zipItems.map(async item => {
    const relativePath = item.name
//    responses = []
    if (item.dir) {
//      responses = responses.concat(await self.createUploadFolderWithLinks(item, zip, destination, zipItems, webId, options))
      responses = await self.createUploadFolderWithLinks(item, zip, destination, zipItems, webId, options)
			return self.uploadExtractedZipArchive(zip, destination, item.name, webId, responses, options) // responses
    } else if (!relativePath.endsWith('.acl') && !relativePath.endsWith('.meta')) {
//			responses = responses.concat(await self.createUploadFileWithAcl(item, destination, zipItems, webId, options))
			responses = await self.createUploadFileWithAcl(item, destination, zipItems, webId, options)
    }
//alert(responses.length + ' '+ Object.keys(responses) + '\n' + Object.values(responses))
    return [].concat(...responses) // alternative to .flat()
  })
// AA with solid-file-client
/*  const reflectedPromises = promises.map(promise => {
    return promise
      .then(value => { return { status: 'fulfilled', value } })
      .catch(reason => { return { status: 'rejected', reason } })
  })
  return Promise.all(reflectedPromises)
*/
/*	return Promise.all(promises)
}

this.createUploadFolderWithLinks = async (item, zip, destination, zipItems, webId, options) => {
  const relativePath = item.name
    
  // cache.remove(path)
  const folderResponse =  await fc.createFolder(`${destination}${relativePath}`, options) // = { merge: SolidFileClient.KEEP_TARGET })
    .catch(e => {console.log('createFolder ' + e); self.e = e; return false})
  let createResponses = [] //[await folderResponse.text()]
//alert('1'+createResponses + typeof createResponses)    
	createResponses = createResponses.concat(await self.createUploadItemLink(destination, relativePath, zipItems, 'acl', webId))
//alert('2'+createResponses)    
	createResponses = createResponses.concat(await self.createUploadItemLink(destination, relativePath, zipItems, 'meta', webId))
// alert('folder '+item.name+'\n'+JSON.stringify(createResponses))    

  return createResponses //.flat()
}

this.createUploadFileWithAcl = async (item, destination, zipItems, webId, options) => {
  const relativePath = item.name
  const blob = await item.async('blob')
  const contentType = blob.type ? blob.type : window.Mimer(relativePath) // blob.type ? blob.type : await guessContentType(relativePath, blob) // item.name, blob);  // a revoir

	// check for acl resource
  // cache.remove(path)
	try {
  await fc.createFile(`${destination}${relativePath}`, blob, contentType)
  return await self.createUploadItemLink(destination, relativePath, zipItems, 'acl', webId)
  } catch(e) {self.err = 'updateFile '+JSON.stringify(e) }
}

this.createUploadItemLink = async (destination, relativePath, zipItems, linkType, webId, linksResponses = []) => {
  const zipItemLink = zipItems.find(item => item.name === `${relativePath}.${linkType}`)
  if (zipItemLink) {
	  const blob = await zipItemLink.async('blob')
		const content = await	blob.text().catch(err => self.err = err) // .then(async content => {
		const linkResponse = await await self.updateLinkFile(destination, zipItemLink.name, content, webId).catch(err => self.err = err)
		// check for .meta.acl
//alert('webId '+webId)
		if ( linkType === 'meta') return await self.createUploadItemLink(destination, relativePath+'.meta', zipItems, 'acl', webId, linksResponses) 
		linksResponses = linksResponses.concat(...linkResponse)
  }
  return linksResponses
}	
/**
 * URI can be any valid Agent (person, group, software Bot)
 * check that URI or Public has control and that the acl is well-formed
 */
/*this.isValidAcl = async (itemUrl, content, URI) => {
	// read .acl content as text and check acl content for Webid or public (authorization, Control, accessTo)
	// groups are not checked for 'Control'
	try {
	
		// check if webId has control (use of aclAgent() or aclControl())
		fc.rdf.setPrefix('URI', URI)
//alert(itemUrl+' '+fc.rdf.getPrefix('URI'))
		let resAcl = await self.checkAcl(itemUrl, content)
		if (resAcl.err === ['incorrect RDF']) return resAcl
//alert('resAcl '+resAcl.err+'\n'+JSON.stringify(resAcl))
		let resMode = await self.aclMode(itemUrl, content, null, null , { URI: '' }, 'Control') // objURI)
//alert('resMode '+JSON.stringify(resMode))
		return {
			err: resAcl.err.concat(resMode.err),
			info: resAcl.info.concat(resMode.info)
		}
	}
	catch(err) { self.err = err } // TODO err manage
}

this.isValidRDF = async (itemUrl, content) => {
	try {
		await fc.rdf.queryTurtle(itemUrl, content)
		return { err: [], info:[]}
	} catch(e) { return { err: ['incorrect RDF'], info:[e] }}
}	

/*this._queryCached = async (url, s, p, o, g) => {
//    if (!g) {
//      g = namedNode(url)
        [s, p, o, g] = [s, p, o, g].map(term => {
          if (typeof term === 'object' && term) {
alert('term '+JSON.stringify(term))
            if (term.id || term.termType) return term // already a namedNode
            const prefix = Object.keys(term) // a hash to munge into a namedNode
            const value = term[prefix]
alert('term '+prefix[0]+value) //JSON.stringify(term))
            if (prefix.length === 1 && prefix[0] === 'thisDoc') {
              if (value) return 'namedNode ' + url + '#' + value // namedNode(url + '#' + value)
              else return namedNode(url)
            }
alert('term value'+value) //JSON.stringify(term))
//            if (ns[prefix]) return namedNode(ns[prefix](value))
            if (fc.rdf.getPrefix(prefix)) alert('prefix '+ fc.rdf.getPrefix(prefix) + value)// return namedNode(this.prefix[prefix] + value)
            return prefix+value // namedNode(prefix + value)
          }
          if (term && typeof term !== 'undefined') return 'literal ' + term //literal(term) // literal
alert('term undefined or null '+term)
          return term // undefined or null
        })
    }
*/
/*this.updateLinkFile = async (path, fileName, content, webId) => {
  // cache.remove(path)
  const options = { links: SolidFileClient.INCLUDE_POSSIBLE }
  const linkUrl = path + fileName //`${path}${fileName}`
	// linkExt = acl or meta
  const linkExt = fileName.slice(fileName.lastIndexOf('.')+1)
  
  // check valid acl
  var isValidLink = { err: [], info: [] }
  if (linkExt === 'acl') {
		isValidLink = await self.isValidAcl(linkUrl, content, webId)
// alert('acl1 '+fileName+' '+JSON.stringify(isValidLink)+'\nerr '+isValidLink.err+typeof isValidLink.err+'\ninfo '+isValidLink.info)
		if (isValidLink.err.length) return [{ err: [`${fileName} : ${isValidLink.err} ${isValidLink.info}`] }]
//alert('acl2 '+fileName+' '+isValidLink.info)
  }

  // check meta is ttl
  if (linkExt === 'meta') { //  && content !== '') {
		isValidLink = await self.isValidRDF(linkUrl, content)
//alert('meta1 '+fileName+' '+ JSON.stringify(isValidLink))
		if (isValidLink.err.length) return [{ err: [`${fileName} : ${isValidLink.err} ${isValidLink.info}`] }]
//alert('meta2 '+fileName+' err '+isValidLink.err+' info '+isValidLink.info)
	}
//alert('link '+fileName+' err '+isValidLink.err+' info '+isValidLink.info)
  
  // create link file
	try {
		var linkRes = []
		if (isValidLink.info.length) linkRes = [{ info: [`${fileName} : ${isValidLink.info}`] }]
	  const linkParent = linkUrl.replace(new RegExp('.'+linkExt+'$'),'')
	  const links = await fc.getItemLinks(linkParent, options).catch(e => { self.err = e })
	  await fc.putFile(links[linkExt], content, 'text/turtle')
//  alert('linkRes1 '+links[linkExt]+'\n'+JSON.stringify(linkRes)) //+'\n'+Object.values(isValidLink.info).length+typeof Object.values(isValidLink.info)+' '+Object.values(isValidLink.info))
  	return linkRes
  } catch(e) { self.err = 'updateLinkFile '+ JSON.stringify(e) +' '+ links[linkExt] +' '+ linkParent }

}

this.getItemsInZipFolder = (zip, folderPath) => {
  const folderAndLinks = ['/', '/.acl', '/.meta', '/.meta.acl']
// ajouter filtre sur options.links
  return Object.keys(zip.files)
    .filter(fileName => {
      // Only items in the current folder and subfolders
      const relativePath = fileName.slice(folderPath.length, fileName.length)
      if (!relativePath || fileName.slice(0, folderPath.length) !== folderPath)
        return false
            
    	// Include current folder and links (.acl .meta .meta.acl)
    	if (folderAndLinks.some(item => 
					relativePath.endsWith(item) && !relativePath.slice(0, -item.length).includes('/'))
				) return true

      // No items from subfolders
      if (relativePath.includes('/') && relativePath.slice(0, -1).includes('/'))
        return false;

      // No current links (they were already added at previous folder level) 
      if (folderAndLinks.some(item => fileName.endsWith(item))) return false

      return true
    })

    .map(key => zip.files[key])
}

/*
 * o parameter is a webId

 * What is the best strategy ?
 * find block with agent, the check if that block has 'control'
 * find block with 'control' and search for agent
 */
/*this.aclAgent = async (itemUrl, content, s, p ,o) => {
	var info = []
	try {
		// find acl block for an agent
		const aclAgent = await fc.rdf.queryTurtle(itemUrl, content, s, p, o)
		if(!aclAgent.length) return [{ err: 'noAgent', message: [] }]

		await aclAgent.map(async ({subject: item}) => {
			// check if agent has 'Control' ('write' may be enough with file atomic delete)
			const aclMode = await fc.rdf.query(itemUrl, item, { acl: 'mode'}, { acl : 'Control' })
			if(!aclMode.length) return [{ err: 'noControl', message: [] }]
	
			// check if accessTo is correct
			//let obj = Object.fromEntries(new Map([['termType', 'NamedNode'],[itemUrl.split('.acl')[0], '']]))
			fc.rdf.setPrefix('parent', itemUrl.split('.acl')[0])
			const aclAccessTo = await fc.rdf.query(itemUrl, item, { acl: 'accessTo' }, { parent: '' })
			if(!aclAccessTo.length) return [{ err: 'noAccessTo', message: [] }]

			// check for default for folder.acl (at least one default)
			if (itemUrl.endsWith('/.acl')) {
				const aclDefault = await fc.rdf.query(itemUrl, null, { acl: 'default' }, { parent: '' }) // item
				if(!aclDefault.length) err = err.concat(['noDefault'])
			}
			// check for authorization, not a blocking error
			const aclAuthorization = await fc.rdf.query(itemUrl, item, null, { acl: 'Authorization' })
			if(!aclAuthorization.length) info = info.concat(['noAuthorization'])
		})	
	} catch( err) {
		return [{ err: ['incorrect RDF'], info: [err] }]
	}
	return [{ err: ['valid'], info: info }]
}

// s : to check a specific block ( null for all]
// p : to check a specific agent type (null for all)
// o : URI of person, group, bot, trusted app, ....
this.aclMode = async (itemUrl, content, s, p ,o , mode) => {
/*	options = {
		aclValid: 'notStrict',
		...options }
*/
//alert('aclMode'+mode)
/*	let res = { err: [], info : [] }
	try {
		// find acl blocks with control
		const aclMode = await fc.rdf.queryTurtle(itemUrl, content, s, { acl: 'mode'}, { acl : mode }) //s, p, o)
    if(!aclMode.length) { res.err = ['no acl:Control']; return res } // ['noControl', ''] }
		fc.rdf.setPrefix('parent', itemUrl.split('.acl')[0])
		
		for (const i in aclMode) {
//		aclControl.map({ subject: item } => {
			let aclItem = aclMode[i].subject.value
			fc.rdf.setPrefix('aclItem', aclItem)
alert('aclMode '+itemUrl+'\n'+i+' '+JSON.stringify(aclMode[i])+'\nobject '+JSON.stringify(fc.rdf.getPrefix(Object.keys(o))))
			// check if agent or everybody has 'Control' ('write' may be enough with atomic delete)
			const aclAgent = await fc.rdf.query(itemUrl, { aclItem: '' }, p, o) // { acl: 'mode'}, { acl : 'Control' })
			if(!aclAgent.length) { // res.err = res.err.concat(['noAgent']) } //, message: [] }] }
//alert(aclAgent.length)
				const aclPublic = await fc.rdf.query(itemUrl, { aclItem: '' }, { acl: 'agentClass' }, null)
//alert(aclPublic.length)
				res.err = aclPublic.length ? [] : ['noAgent with Control'] //, message: [] }] }
				} else {
					res.err = []
				}

/*			// check if accessTo is correct
			// let obj = Object.fromEntries(new Map([['termType', 'NamedNode'],[itemUrl.split('.acl')[0], '']]))
			const aclAccessTo = await fc.rdf.query(itemUrl, { aclItem: '' }, { acl: 'accessTo' }, { parent: '' })
			if(!aclAccessTo.length) res.err = res.err.concat(['invalid or no acl:AccessTo']) //.length }]) // return [{ err: 'noAccessTo', message: [] }] }

			let aclValid = options.aclValid === 'strict' ? 'err' : 'info'
			// check for authorization, not a blocking error
			const aclAuthorization = await fc.rdf.query(itemUrl, { aclItem: '' }, null, { acl: 'Authorization' })
			if(!aclAuthorization.length) res[aclValid] = res[aclValid].concat(['no acl:Authorization']) //: aclAuthorization.length }]) } // return [{ err: 'valid', message: ['noAuthorization'] }] } // this.info = this.info.concat(['noAuthorization']) }
//	return { err: 'valid', message: this.info }

			// for information (not formally needed with NSS) : check for default (container) and authorization (all resources)	
			// check for default for folder.acl TODO all acl block or at least one
			if (itemUrl.endsWith('/.acl')) {
				const aclDefault = await fc.rdf.query(itemUrl, null, { acl: 'default' }, { parent: '' })
				if(!aclDefault.length) res[aclValid] = res[aclValid].concat(['no acl:default or invalid URI']) // }] } // this.info = this.info.concat(['noDefault'])}
			}
//		})
*/
/*		if (res.err === []) return res
		}
	} catch( err) {
		return res = { err: [`incorrect RDF`], info:[err] }
	}
//	alert('info '+this.info)
	return res //[{ err: ['valid'], info : res.info }]
}

this.checkAcl = async (itemUrl, content, options) => {
	options = {
		aclValid: 'notStrict',
		...options }
	
	let resType	
	let res = { err: [], info : [] }
	fc.rdf.setPrefix('parent', itemUrl.split('.acl')[0])
	try {
		// load content in store
		const acl = await fc.rdf.queryTurtle(itemUrl, content)
		if (!acl.length) return { err: [`not an aclFile : content : ${content}`], info: [] } // RDF with no content
		
/*		// at least one acl:default
		if (itemUrl.endsWith('/.acl' && options.aclValid !== 'strict')) {
			const aclDefault = await fc.rdf.query(itemUrl, null, { acl: 'default' }, { parent: '' })
			if (!aclDefault.length) res.err = [`folder.acl MUST have one acl:default - or invalid acl:default URI`]
		}
*/		
		// check each acl block
/*		let aclList = {}
		for (const i in acl) {
			let aclItem = acl[i].subject.value
			aclList[aclItem] = ''
		}
		let aclSubj = Object.keys(aclList)
		for (const i in aclSubj) {
			let aclItem = aclSubj[i]
			fc.rdf.setPrefix('aclSubj', aclItem)
			// check for accessTo
			const aclAccessTo = await fc.rdf.query(itemUrl, { aclSubj: '' }, { acl: 'accessTo' }, { parent: '' })
			if (!aclAccessTo.length) res.err = res.err.concat([`"${aclItem.split('#')[1]}" has no accessTo - or invalid acl:accessTo URI`])
			//check for users
			const aclAgent = await fc.rdf.query(itemUrl, { aclSubj: '' }, { acl: 'agent' }, null)
			const aclAgentClass = await fc.rdf.query(itemUrl, { aclSubj: '' }, { acl: 'agentClass' }, null)
			const aclAgentGroup = await fc.rdf.query(itemUrl, { aclSubj: '' }, { acl: 'agentGroup' }, null)
			if ((aclAgent.length + aclAgentClass.length + aclAgentGroup) === "0") res.err = res.err.concat([`"${aclItem.split('#')[1]}" has no user`])
//alert('aclAgent '+aclAgent.length+aclAgentGroup.length+aclAgentClass.length)			
			
			// check for acl:mode
			const aclMode = await fc.rdf.query(itemUrl, { aclSubj: '' }, { acl: 'mode' }, null)
			if (!aclMode.length) res.err = res.err.concat([`"${aclItem.split('#')[1]}" has no acl:mode`])
//alert('aclMode '+aclAccessTo.length+aclAgentClass.length+aclMode.length)			
			resType = options.aclValid === 'allowNoDefault' ? 'info' : 'err'

			if (itemUrl.endsWith('/.acl')) {
				const aclDefault = await fc.rdf.query(itemUrl, { aclSubj: '' }, { acl: 'default' }, null)
				if (!aclDefault.length) res[resType] = res[resType].concat([`${aclItem.split('#')[1]} has no acl:default - you cannot inherit`])
				else {
					const aclParent = await fc.rdf.query(itemUrl, { aclSubj: '' }, { acl: 'default' }, { parent: '' })
					if (!aclParent.length) res.err = res.err.concat([`${aclItem.split('#')[1]} acl:default has a wrong URI`])
				}
			}

			// check for authorization, not actually a blocking error
			resType = options.aclValid === 'strict' ? 'err' : 'info'
			const aclAuthorization = await fc.rdf.query(itemUrl, { aclSubj: '' }, null, { acl: 'Authorization' })
			if(!aclAuthorization.length) res[resType] = res[resType].concat([`"${aclItem.split('#')[1]}" has no acl:Authorization`]) //: aclAuthorization.length }]) } // return [{ err: 'valid', message: ['noAuthorization'] }] } // this.info = this.info.concat(['noAuthorization']) }
//alert('aclAuthorization '+aclAccessTo.length+aclAgentClass.length+aclMode.length+aclAuthorization.length)			
//alert('res '+JSON.stringify(res))
		}
		return res
	} catch( err) {
		return res = { err: [`incorrect RDF`], info: [err] }
	}
}


this.getFileBlob = async (path) => { // , filename) => {
  let file = path // self.buildFileUrl(path, filename)
  try {
    const res = await fc.get(file) // self.buildFileUrl(path, filename))
    const blob = res.blob()
    return blob
  } catch (err) {
    self.err = err
    return false // throw handleFetchError(err);
  }
}
*/
/*return this
} */
