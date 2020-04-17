/* JSZip handler VERSION 1.0.0
**     2020-04-08
*/

var SolidZip = function() {

var self = this

this.clearCacheForFolder = (path) => cache.remove(path);
this.clearCache = () => cache.clear();

/**
 * Wrap API response for retrieving item list
 * itemList is cached automatically
 * @param {String} path
 * @returns {Promise<Item[]>}
 */
this.getItemList = async (path, options = { links: "excludeLinks" }) => {
  if (cache.contains(path)) {
  	let cacheList = cache.get(path)
  	console.log('cache '+path+'\n'+cacheList)
  	return cacheList // cache.get(path)
  }    

  let folderData = await fc.readFolder(path, options) // { links: SolidFileClient.LINKS.EXCLUDE }) // , links = "excludeLinks")
		.catch(e => { self.err = JSON.stringify(e) })
  if (self.err) { return false}

  const itemList = [
    ...folderData.files.map(item => [item.url, ...Object.values(item.links)]).flat(),
    ...folderData.folders.map(item => item.url),
		...Object.entries(folderData.links).map(([type, item]) => item),
	  ]
	cache.add(path, itemList)
  return itemList
}
 	
/**
 * Request API to upload the items as zip archive
 */
this.createZipArchive = async (path, archive, itemList, acl) => {
  let options = acl==="true" ? { links: 'include' } : { links: 'excludeLinks' }
  return self.getAsZip(path, itemList, options) // , options)
	.then(zip => zip.generateAsync({ type: 'blob' }))
  .then(blob => self.updateFile(path.parent, archive, blob, 'application/zip'))
  .catch(err => {
  	self.err = err
  })
}
	
/**
 * Wrap API response for zipping multiple items
 */
this.getAsZip = async (path, itemList, options) => {
	console.log('getAsZip links '+options.links)
  const zip = new JSZip();

  return self.addItemsToZip(zip, path.url, itemList, options)
    .then(() => zip)
}

/**
 * Add items to a zip object recursively
 */
this.addItemsToZip = async (zip, path, itemList, options) => {
  var promises = itemList.map(async item => {
    const itemName = sol.getItemName(item)
    if (item.endsWith('/')) {
      const zipFolder = zip.folder(itemName)
      const folderPath = item
      const folderItems = await self.getItemList(folderPath, options)
      await self.addItemsToZip(zipFolder, folderPath, folderItems, options);
    }
    else {
			const blob = await self.getFileBlob(item)
      await zip.file(itemName, blob, { binary: true })
    }
  })
  return Promise.all(promises)
}

/**
 * Wrap API response for extracting a zip archive
 */
this.extractZipArchive = async (file, destination = file) => {
	self.acl = []
	try {
		const blob = await self.getFileBlob(file.url) // , '')  // check if it can be simplified
    const zip = await JSZip.loadAsync(blob)
		await self.uploadExtractedZipArchive(zip, destination.parent);
  } catch (err) {
    self.err = err
    return false
  }
}

/**
 * Recursively upload all files and folders from an extracted zip archive
 */
this.uploadExtractedZipArchive = async (zip, destination, curFolder = '') => {
  const promises = await self.getItemsInZipFolder(zip, curFolder)
    .map(async item => {
      const relativePath = item.name
      const itemName = sol.getItemName(relativePath) // self.getItemNameFromPath(relativePath);
	    var path = sol.getParentUrl(`${destination}${relativePath}`) // self.getParentPathFromPath(`${destination}${relativePath}`);  // ${destination}/${relativePath}
      if (item.dir) {
        await self.createFolder(path, itemName)
        await self.uploadExtractedZipArchive(zip, destination, relativePath)
      } else {
        const blob = await item.async('blob')
        let contentType = blob.type ? blob.type : window.Mimer(itemName) // blob.type ? blob.type : await guessContentType(relativePath, blob) // item.name, blob);  // a revoir
      	if (itemName.endsWith('.acl') || itemName.endsWith('.meta')) { contentType = 'text/turtle' }
				alert('blob '+contentType)
				// check for acl resource
      	if (!itemName.endsWith('.acl')) {
          await self.updateFile(path, itemName, blob, contentType) // path+'/'
      	} else {
      	// read .acl content as text and check acl content for Webid or public (authorization, Control, accessTo)
      	// groups are not checked for 'Control'
      		blob.text().then(async content => {
      			this.aclErr = ''

      			// check if webId has control (use of aclAgent() or aclControl())
      			const webId = Object.fromEntries(new Map([[app.webId, '']]))
      			self.aclControl(destination, relativePath, content, null, null , webId)
      			.then( async res => {
      				if(res === 'incorrect rdf') return self.acl = self.acl.concat([relativePath + ': ' + self.err])
      				if (res === 'acl') return await self.updateFile(path, itemName, content, contentType).catch(err => self.err = err)
							if (res === 'noAgent' || res === 'noControl') {
								this.aclErr = 'no "Control" for webId or everybody'

								// or check if everybody has control (use of aclAgent() or aclControl())
								self.aclControl(destination, relativePath, content, null, { acl: 'accessTo' }, null)
			     			.then( async res => {
		      				if (res === 'acl') return await self.updateFile(path, itemName, content, contentType).catch(err => self.err = err)								
									else { self.acl = self.acl.concat([relativePath + ' : ' + this.aclErr]) }
								})
							}
      			})
      			.catch(err => self.err = err)
      	  })
    		}
      }
    })

  return Promise.all(promises);
}

this.getItemsInZipFolder = (zip, folderPath) => {
  return Object.keys(zip.files)
    .filter(fileName => {
      // Only items in the current folder and subfolders
      const relativePath = fileName.slice(folderPath.length, fileName.length)
      if (!relativePath || fileName.slice(0, folderPath.length) !== folderPath)
        return false
            
      // No items from subfolders
      if (relativePath.includes('/') && relativePath.slice(0, -1).includes('/'))
        return false;

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
this.aclAgent = async (path, itemName, content, s, p ,o) => {
	try {
		// find acl block for an agent
		const aclAgent = await fc.rdf.queryTurtle(path+itemName,content, s, p, o)
		if(!aclAgent.length) { return self.err = 'noAgent' }

		await aclAgent.map(async ({subject: item}) => {
			// check if agent has 'Control' ('write' should be enough with atomic delete)
			const aclControl = await fc.rdf.query(path+itemName, item, { acl: 'mode'}, { acl : 'Control' })
			if(!aclControl.length) { return self.err = 'noControl' }
	
			// check if accessTo is correct
			obj = Object.fromEntries(new Map([[(path+itemName).split('.acl')[0], '']]))
			const aclAccessTo = await fc.rdf.query(path+itemName, item, { acl: 'accessTo' }, obj)
			if(!aclAccessTo.length) { self.acl = self.acl.concat([itemName + ' wrong accessTo resource']); return self.err = 'noAccessTo' }
/* not used (not formally needed with NSS) : check for default and authorization	
			// check for default for folder.acl
			if ((path+itemName).split('.acl')[0].endsWith('/')) {
				const aclDefault = await fc.rdf.query(path+itemName, item, { acl: 'default' }, obj)
				if(!aclDefault.length) { self.acl = self.acl.concat([itemName + ' folder should have acl:default'])} //; return self.err = 'noAuthorization' }
			}
			
			// check for authorization, not a blocking error
				const aclAuthorization = await fc.rdf.query(path+itemName, item, null, { acl: 'Authorization' })
				if(!aclAuthorization.length) { self.acl = self.acl.concat([itemName + ' no acl:authorization (for information only)'])} //; return self.err = 'noAuthorization' }
*/		
		})
	} catch( err) {
		self.err = err
		return 'incorrect rdf'
	}
	return 'acl' //self.updateFile(path, itemName, content, contentType).catch(err => self.err = err)
}

this.aclControl = async (path, itemName, content, s, p ,o) => {
	try {
		// find acl block for an agent
		const aclControl = await fc.rdf.queryTurtle(path+itemName,content, s, { acl: 'mode'}, { acl : 'Control' }) //s, p, o)
    if(!aclControl.length) { return self.err = 'noControl' }

		await aclControl.map(async ({subject: item}) => {
			// check if agent has 'Control' (check if 'write' could be enough with atomic delete)
			const aclAgent = await fc.rdf.query(path+itemName, item, p, o) // { acl: 'mode'}, { acl : 'Control' })
			if(!aclAgent.length) { return self.err = 'noAgent' }
	
			// check if accessTo is correct
			obj = Object.fromEntries(new Map([[(path+itemName).split('.acl')[0], '']]))
			const aclAccessTo = await fc.rdf.query(path+itemName, item, { acl: 'accessTo' }, obj)
			if(!aclAccessTo.length) { self.acl = self.acl.concat([itemName + ' wrong accessTo resource']); return self.err = 'noAccessTo' }
/* not used (not formally needed with NSS) : check for default and authorization	
			// check for default for folder.acl
			if ((path+itemName).split('.acl')[0].endsWith('/')) {
				const aclDefault = await fc.rdf.query(path+itemName, item, { acl: 'default' }, obj)
				if(!aclDefault.length) { self.acl = self.acl.concat([itemName + ' folder should have acl:default'])} //; return self.err = 'noAuthorization' }
			}
			
			// check for authorization not a blocking error
			const aclAuthorization = await fc.rdf.query(path+itemName, item, null, { acl: 'Authorization' })
			if(!aclAuthorization.length) { self.acl = self.acl.concat([itemName + ' no acl:authorization'])} // ; return self.err = 'noAuthorization' }
*/		
		})
	} catch( err) {
		self.err = err
		return 'incorrect rdf'
	}
	return 'acl' //self.updateFile(path, itemName, content, contentType).catch(err => self.err = err)
}

/**
 * Wrap API response for uploading a file
 */
this.updateFile = (path, fileName, content, contentType) => {
  cache.remove(path)
  return fc.createFile(path+fileName, content, contentType)
    .catch(e => { self.err = 'updateFile '+JSON.stringify(e) })
};
/*this.updateFile = (path, fileName, content, contentType) => {
  cache.remove(path)
  return fc.putFile(path+fileName, content, contentType)
    .catch(e => { self.err = 'updateFile '+JSON.stringify(e) })
};
*/
/**
 * Wrap API response for retrieving file content
 */
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

/**
 * Wrap API response for creating a folder
 */
this.createFolder = (path, folderName) => {
  let file = `${path}${folderName}/` // self.buildFolderUrl(path, folderName)
    
  cache.remove(path)
  if (!(folderName || '').trim()) {
    return Promise.reject('Invalid folder name')
  }
  return fc.createFolder(file, {
    merge: SolidFileClient.MERGE.KEEP_TARGET
    })
    .catch(e => {console.log('createFolder ' + e); self.e = e; return false})
}

return this
}
