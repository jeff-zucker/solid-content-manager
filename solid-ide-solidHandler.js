/* VERSION 0.1.2
**     2018-11-27
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
this.replace = async function(url,content){
    var del = await fc.deleteFile( url )
    var add = await fc.createFile(url,undefined,content)
    return(add)
}
this.rm = fc.deleteFile
this.add = async function(parentFolder,newThing,type,content) {
    var filetype;
    if(type==='folder') return fc.createFolder(parentFolder+newThing)
    else return fc.createFile(parentFolder+newThing,type,content)

}
this.get = async function(thing){
    self.qname="";
    thing = thing || self.urlFromQueryString()
    if(typeof(thing)==='string') thing = { url:thing }
    if(! thing.type) thing.type = fc.guessFileType(thing.url)
    var body = await fc.fetch(thing.url)
    if(!body){ self.err=fc.err; return false }
    self.log("got a "+thing.type)
    if( thing.type==="folder" ) {
        var graph = fc.text2graph(body.value,thing.url,"text/turtle")
        if(!graph) {
            self.err = fc.err
            return false
        }
        else {
            let folder = fc.processFolder( graph,thing.url,body.value) 
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
    }
    else {
        if(body && body.value && body.value.match('alert-danger')
           && !thing.url.match('solid-auth-simple')
        ) {
            self.err = fc.err
            return false
        }
        else return('file',{key:"file",value:{
            type:thing.type,
            content:body.value,
            url:thing.url
        }})
    }
}
/* SESSION MANAGEMENT
*/
this.checkPerms = async function(url,agent,session){
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
    if( self.storage && url.match(self.storage) )
        return { Read:true, Write:true, Control:true  }
    else
        return { Read:true, Write:false, Control:false  }
}
this.checkStatus = async function(url){
   var sess = await fc.checkSession()
   var webId    = (sess) ? sess.webId : ""
   var storage  = (sess) ? sess.storage : ""
   var loggedIn = (sess) ? true : false
   var perms = await self.checkPerms(url,webId)
   return { 
                webId:webId,
                storage:storage,
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
    if(thing.url){
        self.qname = thing
        var name   = thing.url.substring(thing.url.lastIndexOf('/')+1);
        var folder = thing.url.replace(name,'')
        thing = {
             url : folder,
            type : "folder"
        }
    }
    else {
        thing = {
             url : "https://solside.solid.community/public/samples/",
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
return this
}
if (typeof(module)!="undefined" )  module.exports = solidAuthSimple()
/* END */
