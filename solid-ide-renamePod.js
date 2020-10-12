/* RenamePodServer handler VERSION 1.0.0
**     2020-10-11
*/


var RenamePodServer = function() {

var self = this

  /**
   * renameURI
   * @param {options.source} 'solid.community'
   * @param {options.target} 'solidcommunity.net'
   */
this.renameURI = async (path, options) => {
    options = {
      links: 'include',
      testRename: true,
      ...options
    }
    const itemList = [path]
    self.err = ''
    return self.renameItems(itemList, options)  }

  /**
   * rename items with links recursively
   */
this.renameItems = async (itemList, options) => {
      var promises = itemList.map(async item => {
      const itemName = self.getItemName(item)
      // rename folder with links
      try {
        if (item.endsWith('/')) {
          if (options.links === SolidFileClient.LINKS.INCLUDE) {
            await self.renameItemLinks(item, options)
          }
          const folderItems = await fc.getFolderItemList(item, { links: 'exclude' })
          await self.renameItems(folderItems, options)
        // rename file with links
        } else {
          const res = await fc.get(item)
          let contentType = res.headers.get('content-type').split(';')[0]
          console.log(item, contentType)
          if (contentType === 'text/turtle') {
          const content = await res.text()
          await self.renameItem(item, content, contentType, options)
          }
          if (options.links === SolidFileClient.LINKS.INCLUDE) {
          await self.renameItemLinks(item, options)
          }
        }
      } catch (err) {self.err = self.err + err}
    })

    return Promise.all(promises)
  }

  /*
  * rename item and putFile()
  */
this.renameItem = async (item, content, contentType, options) => {
    self.fileTested += 1
    const patt = new RegExp(options.source)
    if (patt.test(content)) {
    // replace only URI's
    let contentArray = content.split(('<'))
    for (let i = 1; i < contentArray.length; i += 1) {
      let contentItem = contentArray[i].split('>')
      console.log(contentItem[0])
      let res = contentItem[0].replace(new RegExp(options.source), options.target)
      if (res !== contentItem[0]) {
          contentItem[0] = res
          contentArray[i] = contentItem.join('>')
      }
    }
    const newContent = contentArray.join('<')
    self.number += 1
    self.listRenameDoc = self.listRenameDoc.concat(item)
    if (!options.testRename) {
      await fc.putFile(item, newContent, contentType)
      console.log('put ' + item)
    }
  }
}

  /**
   * rename item links and // not acually : optionally make relative for acl's
   *
   */
  this.renameItemLinks = async (item, options) => {
    /* options = {
      relativeAcl: false,
    } */
    options.agent = 'to_target'
    const links = await fc.getItemLinks(item, options)
    let itemLinks = [...Object.values(links)]
    if (links.meta) {
      itemLinks = [itemLinks, ...Object.values(await fc.getItemLinks(links.meta, options))].flat()
    }
    for (const i in itemLinks) {
      const itemLink = itemLinks[i]
      let content = await fc.readFile(itemLink)
      /* if (itemLink.endsWith('.acl') && options.relativeACl) {
        const itemName = item.endsWith('/') ? '' : self.getItemName(item)
        options.agent = 'to_target'
        content = fc.acl.makeContentRelative(content, item, itemName, options)
      } */
      const res = await self.renameItem(itemLink, content, 'text/turtle', options).catch(err => {})
    }
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
