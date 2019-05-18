/* VERSION 0.1.3
**     2019-03-30
*/
const sol = new SolidHandler()      // from solid-ide-solidHandler.js
const fc = SolidFileClient;         // from solid-file-client.bundle.js

var init = function(){
    app.getStoredPrefs()
    sol.get().then( results => {
        app.processResults(results)
    })
}

var app = new Vue({
    el: '#app',
    methods : {
//
// COMMUNICATE WITH THE SOLID SERVER
//
        get : function(thing){ 
            var oldThing = this.currentThing
            this.currentThing = thing
            view.hide();
            sol.get(thing).then( results => {
                 if(sol.err){
                     alert(sol.err)
                     if(oldThing.url===thing.url) 
                         oldThing.url = sol.homeUrl;
                     view.refresh(oldThing.url)
                 }
                 else this.processResults(results)
            })
        },
        rm : function(f){
            if(!this.perms.Control) return
            if( confirm("DELETE RESOURCE "+f.url+"???") ){
                view.hide('fileManager')
                view.hide('folderManager')
                var parentFolder =f.url.replace(f.name,'')
                sol.rm( f.url ).then( success =>{
                    if(success){
                        alert("Resource deleted: " + f.url)
                        view.refresh(parentFolder)
                    }
                    else alert("Couldn't delete "+sol.err)
               })
            }
        },
        upload : async function(f){
            view.hide('folderManager')
        	var inputFile = document.getElementById("upFile")
			for (var i = 0; i < inputFile.files.length; i++) {
				var content = inputFile.files[i] 
        		var url  = this.folder.url+content.name;
        		success = await sol.replace(url,content )
        		if(success){
        			alert("Resource created: " + content.name)
        		}
        		else alert("Couldn't create "+url+" "+sol.err)
			}
            view.refresh(this.folder.url)
        },        	
        addThing : function(type){
            if(!this.newThing.name){
               alert("You didn't supply a name!")
               return;
            }
            view.hide('folderManager')
            var name = this.newThing.name
            var url  = this.folder.url
            sol.add(url,name,type ).then( success => {
                if(success){
                    alert("Resource created: " + name)
                    view.refresh(this.folder.url)
                }
                else alert("Couldn't create "+url+" "+sol.err)
            })
        },
        manageResource : function(thing){
            if(!this.perms.Control) return
            if(thing.type==="folder"){
                this.folder = thing;
                view.show('folderManager');
            }
            else {
                this.file = thing;
                view.show('fileManager');
            }
        },
        getProfile : function(){ 
            var url =  this.webId.replace('#me','')
            view.refresh( url )
        },
        download : function(f){
            var a = document.createElement("a");
            a.href = f.url
            a.setAttribute("download", f.name);
            var b = document.createEvent("MouseEvents");
            b.initEvent("click", false, true);
            a.dispatchEvent(b);
            return false;
         },
//
// EDITOR & FILE MANAGER SETTINGS
//
        setEditKeys  : function(){
            fileDisplay.setEditKeys(this.editKeys)
        },
        setEditTheme  : function(){
             fileDisplay.setEditTheme(this.editTheme)
        },
//
// LOGIN STATES
//
        canControl : function(){
            if( this.perms.Control ) return "canControl"
        },
        setLogState : function(){
              if( this.loggedIn ){
                   this.logState = "login"
                   sol.webId=this.webId="";
                   fc.logout().then( res => {
                       view.refresh(sol.homeUrl)
                   })
               }
               else { 
                   this.logState = "logout"
                   sol.homeUrl = this.homeUrl
                   fc.logout().then( ()=> {
                       fc.popupLogin().then(function(){
                           view.refresh()
                       })
                   })
               }
            },
        getLogState : function(status){
            var elm = document.getElementById('optionsButton')
            if(status.loggedIn){
                this.webId = status.webId
                this.logState = "logout";  // logState is the button label
                this.loggedIn = true;      // loggedIn is true/false

            }
            else{
                this.webId = ""
                this.logState = "login";
                this.loggedIn = false;
            }
            this.perms=status.permissions
        },
//
// LOCAL STORAGE OF PREFERENCES
//
        storePrefs : function(){
            localStorage.setItem("solState", JSON.stringify({
                  home : this.homeUrl,
                   idp : sol.idp,
                  keys : this.editKeys,
                 theme : this.editTheme,
            }))
        },
        getStoredPrefs : function(){
            var state = localStorage.getItem("solState");
            if(!state) {
                sol.homeUrl = this.homeUrl =
                    "https://solside.solid.community/public/samples/"
                sol.idp = this.idp =  "https://solid.community"
                return;
            }
            state = JSON.parse(state)
            sol.homeUrl = this.homeUrl = state.home
            sol.idp     = this.idp     = state.idp
            this.editKeys  = state.keys
            this.editTheme = state.theme
            fileDisplay.initEditor();
            fileDisplay.setEditTheme(this.editTheme);
            fileDisplay.setEditKeys(this.editKeys);
            return state
        },
//
// MAIN PROCESS LOOP, CALLED ON RETURN FROM ASYNC SOLID CALLS
//
        processResults : function(results){
            if(!results){
                alert( sol.err )
                return
            }
            var key = results.key
            var val = results.value
            if(key.match("folder")){
                app.folder = val
                app.currentThing = val
                if(sol.qname) { 
                    app.currentThing = sol.qname
                    sol.get(sol.qname).then( results => { 
                        if(!results) alert(sol.err)
                        app.processResults(results)
                    })
                }
                else if(sol.hasIndexHtml) { 
                   app.currentThing = {
                       url : val.url + "index.html",
                      type : "text/html"
                    }
                    sol.get(app.currentThing).then( results => { 
                        if( !results ) alert(sol.err)
                        app.processResults(results)
                    })
                }
            }
            if( val.type.match(/(image|audio|video)/)  ){
                val.content=""
            }
            fileDisplay.setContent(val.content) 
            fileDisplay.file.srcUrl = app.currentThing.url
            sol.checkStatus(val.url).then( status => {
                var url = location.href.replace(/^[^\?]*\?/,'')
                var url2 = location.href.replace(url,'').replace(/\?$/,'')  
                if(url2) {
                    url2 = url2  + "?url="+encodeURI(val.url)
                }
                history.pushState({s:2,b:1},"solside",url2)
                app.getLogState(status)
                view.modUI(status,val.type)
            }, err => { console.log(err)})
        }, /* process results */

    }, /* methods */
    data: { 
        fontSize     : "medium",
        editKeys     : "emacs",
        editTheme    : "dark theme",
        perms        : {},
        currentThing : {},
        newThing     : {},
        file         : {},
        folder       : { name:'loading...' },
        idp          : "",
        homeUrl      : "",
        webId        : "",
        logState     : "login",
    }, /* data */
}) /* app */

    var fileDisplay = new Vue({
        el  : '#fileDisplay',
        data : {file:{content:""},displayState:"both" },
        methods : {
            initEditor : function(){
                this.zed = new SolidIdeEditor('editor');
                var keys  = app.editKeys  || "emacs"
                var theme = app.editTheme || "dark theme"
                this.setEditKeys(keys);
                this.setEditTheme(theme);
                var size=14; //1260x720 iH = 581px; 1366x768 = 618px
                if(window.innerHeight>600) size = 18
                if(window.innerHeight>900) size = 22
                if(this.displayState==="edOnly") size = size*2;
                this.zed.setSize(size);
            },
            setEditKeys  : function(keys){
                var newKey ="zemacs";
                if(keys==='vim') newKey ="vim"
                this.zed.setKeys(newKey)
                this.keys = newKey;
            },
            setEditTheme  : function(theme){
                var newTheme = "github"
                if(theme.match("dark")){
                    newTheme = "monokai"
                }
                this.zed.setTheme(newTheme)
                this.theme=newTheme
            },
            setContent : function(content){
                //  if(!this.zed) this.initEditor()
                this.initEditor()
                this.file = app.currentThing;
                this.file.content = content;
                if(!this.file.type && this.file.url) 
                    this.file.type = sol.guessFileType(this.file.url)
                this.zed.setModeFromType(this.file.type)
                this.zed.setContents(content)
                this.zed.ed.clearSelection() // remove blue overlay
            },
            saveEdits : function(){
                sol.replace(
                    this.file.url,
                    this.zed.getContents()
                ).then( success => {
                    if(success){
                        alert("Resource saved: " + this.file.url)
                        view.refresh(this.file.url)
                    }
                    else alert("Couldn't save "+sol.err)
               })
            },
            togglePanes : function(){
                if(this.displayState==='edOnly'){
                    this.displayState="dataOnly";
                    this.initEditor()
                return;
                }
                if(this.displayState==='dataOnly'){
                   this.displayState="both"; 
                   this.initEditor()
                   return;
                }
                if(this.displayState==='both'){
                    this.displayState="edOnly";
                    this.initEditor()
                    return;
                }
            },
        }
    })

    var view = {
       currentForm : "",
       show : function(area){
            this.currentForm = this.currentForm || area;
            var x = document.getElementById(this.currentForm)
            document.getElementById(this.currentForm).style.display = 'none'; 
            this.currentForm = area;
            document.getElementById(area).style.display = 'block'; 
            document.getElementById('fileDisplay').style.display = 'none'; 
        },
        hide : function(area){
            document.getElementById('fileDisplay').style.display = 'block'; 
            area = area || this.currentForm;
            if(area)
                document.getElementById(area).style.display = 'none'; 
        },
        refresh : function(url) {
              var url = url || app.currentThing.url
              url = location.href.replace(/\/\??.*/,'').replace(/#$/,'')
                  + "?url="  + url
              url = url.replace(/\/\/$/,'/')
              location.href = url
        },
        modUI : function(status,type){
            var saveButton    = document.getElementById('saveEdits')
            var optionsButton = document.getElementById('optionsButton')
            var profileButton = document.getElementById('profileButton')
            var editDisabled = document.getElementById('editDisabled')
            saveButton.style.display="none"
            optionsButton.style.backgroundColor="#ddd"
            profileButton.style.display="none"
            editDisabled.style.display="table-cell"
            if(status.loggedIn) {
                optionsButton.style.backgroundColor = "rgba(145,200,220,2)";
                profileButton.style.display="inline-block"
                if( status.permissions.Write 
                 && !type.match(/(image|audio|video|folder)/)
                ){
                    saveButton.style.display = 'table-cell'
                    saveButton.style.backgroundColor = "rgba(145,200,220,2)"
                    editDisabled.style.display="none"
                }
            }
        }
    }

    init()

