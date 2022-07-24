import {Modal} from '../../solid-ui-components/src/view/modal.js';
import {Form} from  '../../solid-ui-components/src/view/form.js';
import {CU} from    '../../solid-ui-components/src/utils.js';
import {makeProjectMenu} from    './project.js';
import {makeStorageMenu} from    './storageMenu.js';

let u = new CU();

async function setMenu(wantedMenu,event){

  wantedMenu ||= "top-menu";
  let menus = document.querySelectorAll('#left-column > div');
  toggleScreens('display');
  for(let menu of menus){
    if(menu.id===wantedMenu){
      menu.style.display = "block" ;
      if(menu.id.match(/project/)) window.zeditor = await makeProjectMenu(null,window.zeditor);
      else if(menu.id.match(/settings/)){
          let wantedContainer = event.target.getAttribute('about');
          window.zeditor = await makeStorageMenu(wantedContainer);
      }
      else await solidUI.activateComponent('#'+menu.id);
    }
    else menu.style.display = "none" ;
  }
  localStorage.setItem("zeditor",window.zeditor);
}


/* FILE MANAGEMENT
     save loadZeditor
*/
  window.loadZeditor = async function loadZeditor(uri,screen,format){
    screen ||= "both";
    format ||= "";
    let rselector = document.getElementById('resourceSelector');
    if(!uri && rselector && rselector.childNodes){
     uri = rselector.childNodes[0].value
     uri = decodeURI(uri);
    }
    let i = u.fileInfo(uri);
    if(!i) return;
    if(i.isContainer){
      return makeStorageMenu(uri,null,'skip');
    }
    if(typeof uri !="string") uri = uri.url || uri.uri;
    if(uri) i = await u.loadFile(uri); 
    if(!i || !i.ok) return;
    let string = i.body;
    let UItype;
    if(i.type==="rdf"){
      i = await u.crossLoad(uri,string);
      UItype = u.getUItype(uri);
    }
//    currentFile = i;
    zeditor.currentFile = i;
    if(!screen || screen!="editor") {
      let displayString = string;
      let displayUri = uri;
      let displayCtype = i.contentType;
      /**
       *  show project.outputPage on top, edit project.template on bottom
       */
      if(zeditor.currentProject &&zeditor.currentProject.pageTemplate===i.url){
        let outputPage = zeditor.currentProject.outputPage;
        let r = await u.loadFile(zeditor.currentProject.outputPage);
        displayString = r.body;
        displayUri = outputPage
        displayCtype = r.contentType;
      }
      await u.show(displayCtype,displayUri,displayString,"#display",true)
    }
    document.querySelector(".menu .url").innerHTML = i.url;
    zeditor.currentFileURL = i.url;
//    document.querySelector(".menu .type").innerHTML = UItype || i.type;
    zeditor.UItype = UItype;
    if(UItype==="DataTemplate"){
      const form = await (new Form()).render({
        form:window.origin+"/solid/solid-ide/templates/sparql-form.ttl#this",
        formSubject:u.getMainSubject(uri),
      });
      // document.getElementById('formInEditor').innerHTML = "";
      // document.getElementById('formInEditor').appendChild(form);
      let el = document.querySelector("#formInEditor");
      el.innerHTML = "";
      el.appendChild(form);
      showFormEditor();
      return
    }
    else hideFormEditor();
    if(screen) toggleScreens(screen);
    
//    if(!screen || screen != "display") hideFormEditor();
    if(i.editable) {
//      document.querySelector(".menu .url").innerHTML = i.url;
//      document.querySelector(".menu .type").innerHTML = UItype || i.type;
      zeditor.currentFileUrl = i.url;
      zeditor.UItype = UItype;
      if(format && format==="rdfa"){
        showRDFa(uri);
      }
      if(!screen || screen!="display") {
/*
        if(UItype==="DataTemplate"){
          const form = await (new Form()).render({
            form:"http://localhost:3101/solid/zeditor/sparql-form.ttl#this",
            formSubject:u.getMainSubject(uri),
          });
          document.getElementById('formInEditor').innerHTML = "";
          document.getElementById('formInEditor').appendChild(form);
          showFormInEditor();
          return
        }
        else {
*/
//          showEditorInEditor();
          await showInEditor(uri,string,i);
          return
        }
//      }
    }
    else{
//      showEditorInEditor();
      toggleScreens('display');
    }
  }


  /* SAVE
  */
  async function save(){
    let uri = zeditor.currentFileUrl;
    let string = zeditor.editor.getContents();
    let i = zeditor.currentFile;

    /* IF NOT IN FORM-EDITOR, SAVE THE CURRENT EDITOR CONTENT
    */
    if(!zeditor.formEditor) { // don't save forms, they save themselves
      try {
        let response = await u.PUT(i.url,string,i.contentType);
        if(!response.ok) alert(response)
//        else u.show(i.contentType,i.url,string,"#display",true);
      }catch(e){console.log(e); }
    }

    /* IF PROJECT, ALSO SAVE PROJECT OUTPUT PAGE
    */
    let outputString = zeditor.currentProject ?await saveOutputPage(zeditor.currentProject,string) :"";

    /* RE-DISPLAY CURRENT EDITOR CONTENT IN DISPLAY AREA
    */
    if(zeditor.currentProject){
      if(zeditor.currentProject.pageTemplate===i.url){
        await showOutputPage(zeditor.currentProject)
      }
      else 
        if(zeditor.UItype==="DataTemplate")
          await u.show(i.contentType,i.url,null,"#display",true);
        else
          await u.show(i.contentType,i.url,string,"#display",true);
    }
    else 
      await u.show(i.contentType,i.url,string,"#display",true);
  }

  async function showOutputPage(project){ 
    await u.crossLoad(project.url);
    await u.show("text/html",project.outputPage,null,"#display",true); 
  }

  async function saveOutputPage(project,string){ 
    let generated = (await u.show("rdf",project.url,null,null,true));
    if(typeof generated !="string") generated = generated.outerHTML;
    try {
      let r = await u.PUT(project.outputPage,generated,'text/html');
      if(!r.ok) alert(r);
      else { return generated; }
    }catch(e){console.log(e); return; }
  }

  async function showRDFa(uri){
    // uri ||= document.querySelector(`#e1 .url`).innerHTML;
    uri ||= zeditor.currentFileURL;
    try {
      let r = await UI.store.fetcher.webOperation("GET",uri,{headers:{Accept:"text/turtle"}});
      if(r.ok){
        u.show("text/turtle",uri,r.responseText,"#display",true);
      }
      else alert(r);
    }catch(e){console.log(e); return; }
  }

/* 
  EDITOR
*/
  function showInEditor(uri,string,fileInfo){
//    document.querySelector(".menu .url").innerHTML = fileInfo.url;
//    document.querySelector("#currentFileUrl").innerHTML = fileInfo.url;
    zeditor.currentFileUrl = fileInfo.url;
    zeditor.editor.setContents(string);
    document.querySelector('#editor').focus();
    zeditor.editor.ed.focus();
    zeditor.editor.ed.moveCursorTo(0,0);
  }
  function makeEditor(targetSelector,type){
    var editor = new AceShim(targetSelector);
    editor.setTheme("cobalt");
    editor.setKeys("zemacs");
    if(type==="rdf") type = "turtle";
    if(type==="graphviz") type = "dot";
    editor.setMode(type); // javascript,turtle,dot,markdown,html,css
    editor.ed.setOption("wrap",true);
    editor.ed.focus();
    return editor;
  }

/*
  LOGIN
*/
    const authSession = UI.authn.authSession
    const loginButtonArea = document.getElementById("login");
    async function mungeLoginArea(){
      document.getElementById('shadowBody').classList.add("loading");
      const params = new URLSearchParams(location.search)
      if(typeof window.zeditor==="undefined"){
        window.zeditor = localStorage.getItem("zeditor") || {
          editor : makeEditor("#editor","turtle"),
          currentProject : "",
          currentScreen : "display",
          currentFile : {},
          lastVisited : "",
          wantedURL : "",
        }
      }
/*
      params.set('uri', uri);
      window.history.replaceState({}, '', `${location.origin}${location.pathname}?${params}`);
*/
      document.getElementById('e1').display="none";
      if(!loginButtonArea) return init();
      loginButtonArea.innerHTML="";
      loginButtonArea.appendChild(UI.login.loginStatusBox(document, null, {}))
      const signupButton = loginButtonArea.querySelectorAll('input')[1];
      if(signupButton) signupButton.style.display="none";
      const me = await UI.authn.checkUser();
      const button = loginButtonArea.querySelector('input');         
      if (me) {       
        loginButtonArea.style.display="inline-block";
        button.value = "Log out!";           
        button.title = me.value;
      }
      else {
        loginButtonArea.style.display="inline-block";
        button.value = "Log in!";           
        button.title = "";
      }
      await init();
    }      
    if (authSession && loginButtonArea) {
      loginButtonArea.style.display="none";
      authSession.onLogin(()=>{mungeLoginArea()});
      authSession.onLogout(()=>{console.log("");mungeLoginArea()});
      authSession.onSessionRestore(mungeLoginArea);
    }    
    mungeLoginArea();


  function addClass(elementSelector,className){
    document.querySelector(elementSelector).classList.add(className);
  }
  function removeClass(elementSelector,className){
    document.querySelector(elementSelector).classList.remove(className);
  }



  function navigate(direction) {
      let el = document.querySelector('#resourceSelector select');
      let max = el.childNodes.length;
      let current = el.selectedIndex;
      let next = current<max-1 ?current+1 :0;
      if(direction==="previous") next = current>0 ?current-1 :max-1;
      el.selectedIndex=next;
      loadZeditor(el[el.selectedIndex].value);
  }
  
    function toggleScreens(newScreen){
      let current = document.body.classList;
      if(current.length===0){
        addClass('body',"both");
        current = document.body.classList;
      }
      if(newScreen){
        for(let s of ["both","display","editor"]) removeClass("body",s);
        addClass("body",newScreen);
        if(newScreen==="display"){
          hideFormEditor();
        }
        else zeditor.editor.setSize(newScreen==="editor" ?42 :20);
        return;
      }
      if(current.contains('editor')) {
        removeClass("body","editor");
        addClass("body","display");
      }
      else if(current.contains('display')) {
        removeClass("body","display");
        addClass("body","both");
        zeditor.editor.setSize(20);
      }
      else if(current.contains('both')) {
        removeClass("body","both");
        addClass("body","editor");
        zeditor.editor.setSize(42);
      }
    }

  function showFormEditor(){
    zeditor.formEditor = true;
    document.querySelector('#formInEditor').style.display="block";
  }
  function hideFormEditor(){
    zeditor.formEditor = false;
    document.querySelector('#right-column #formInEditor').style.display="none";
  }
  async function toggleMenu(wantedMenu){
    wantedMenu ||= 'MainMenu';
    let kids = document.querySelector('#menuArea').childNodes;
    for(let kid of kids){
console.log(kid.id,wantedMenu)
      if(kid.id===wantedMenu) kid.style.display="block";
      else kid.style.display="none";
    }
  }

  async function init(){
   await solidUI.activateComponent('#menuArea');
   await solidUI.activateComponent('#mainMenu');
// instead in mungeLogin, set and get window.zeditor in localStorage
    window.zeditor = {
      editor : makeEditor("#editor","turtle"),
      currentProject : "",
      currentScreen : "display",
      currentFile : {},
      lastVisited : "",
      wantedURL : "",
    }
/*
    let topButtons = document.querySelectorAll('#top-menu button');
    for(let button of topButtons){
      button.addEventListener('click',(e)=>{
        let com = e.target.value;
        setMenu(com,e);
      });
    }
*/
/*
    document.querySelector('#myContent').addEventListener("click",async()=>{
      document.getElementById('main-menu').style.display="none";
      zeditor = await makeStorageMenu(zeditor);
    });
    document.querySelector('#publicContent').addEventListener("click",async()=>{
      toggleScreens("display");
      document.getElementById('main-menu').style.display="none";
      document.getElementById('pods-menu').style.display="none";
      document.getElementById('settings').style.display="none";
      document.getElementById('project').style.display="none";
      document.getElementById('sidebar').style.display="block";
    });
    document.querySelector('#sharedContent').addEventListener("click",async()=>{ 
      document.getElementById('main-menu').style.display="none";
      zeditor = await makeProjectMenu(null,zeditor);
    });
*/
    document.querySelector('.screen').addEventListener("click",async()=>{
      toggleScreens();
    });
    document.querySelector('.menu.button').addEventListener("click",async(e)=>{
      toggleMenu();
    });
/*
    (new Modal()).render({
      targetSelector : ".menu.button",
      label   : "\u2630",
      iframe : "templates/about.html",
      width   :  "90%",
      height  :  "85%",
    });

    document.querySelector('.menu.button').addEventListener("click",async(e)=>{
      setMenu('top-menu');
    });
    document.querySelector('.next').addEventListener("click",async(e)=>{
      navigate('next');
    });
    document.querySelector('.previous').addEventListener("click",async(e)=>{
      navigate('previous');
    });
*/
    document.getElementById('save').addEventListener("click",(e)=>{
      save("#e1");  
    });
/*
    (new Modal()).render({
      targetSelector : "#prefix",
      label   : "Find Prefix",
      iframe : "prefix.html",
      width   :  "80%",
      height  :  "40%",
    });
*/
    removeClass('#shadowBody',"loading");
//    setMenu();
/*
    const params = new URLSearchParams(location.search)
    let url2open = params.get('url');
    u.menuize('#top-menu');
    if(url2open) zeditor = await makeProjectMenu( url2open, zeditor);
    else {
      zeditor = await makeStorageMenu(zeditor);
    }
*/
  }

  

/*
loadZeditor
save
showRDFa
showOutputPage
saveOutputPage
showInEditor
makeEditor

init
mungeLoginArea
add/remove Class
navigate
toggleScreens
showFormEditor
hideFormEditor
toggleMenu
*/
