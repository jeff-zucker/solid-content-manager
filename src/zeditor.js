import {Modal} from '../../solid-ui-components/src/view/modal.js';
import {Form} from  '../../solid-ui-components/src/view/form.js';
import {CU} from    '../../solid-ui-components/src/utils.js';
import {LoadProfile} from '../node_modules/solid-load-profile/src/loadProfile.js';

let u = new CU();

var zeditor = {
  editor : makeEditor("#editor","turtle"),
  currentProject : "",
  currentScreen : "both",
  currentFile : {},
  lastVisited : "",
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
      return makeContainerSelector(uri);
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

console.log(zeditor);

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

    /* 
    *  ENSURE CONFIGURATION
    *  get the public configuration
    *  if logged-in, get the private configuratin also
    */
    async function ensureConfiguration(webid){
      let profile = new LoadProfile();
      await profile.loadFullProfile(webid);
      let structure = profile.structure();
      let storages = structure.storages;
      let types = (structure.registrations)["http://www.w3.org/ns/ui#PageDefinition"] || {instances:[]};
/*
      let storages = profile.storages();
      let types = (profile.registrations())[UI.ns.ui('PageDefinition').value] || {instances:[]};
      let types = (profile.registrations())[UI.ns.ui('PageDefinition').value] || {instances:[]};
*/
      hosts = storages.concat(types.instances);
      return hosts;
    }
    var hosts=[];
/* SELECTORS
*/
/*
    const hosts = [
      "https://jeff-zucker.solidcommunity.net/",
      "http://localhost:3101/",
      "https://jeff-zucker.solidcommunity.net:8443/",
    ];
*/
  let wantedURL = window.origin + "/solid/solid-ide/examples/test.gv";
  function getWanted(){ return u.fileInfo(wantedURL)||hosts[0] }

  async function makeStorageMenu(container){
    zeditor.currentProject="";
    removeClass('#left-column','project');
    await ensureConfiguration(window.origin+"/profile/card#me");
    let wanted=getWanted();
    u.makeSelector(hosts,async(e)=>{await makeContainerSelector(e)},wanted.host,"#hostSelector");
    await makeContainerSelector(wanted.url);
    await loadZeditor(wanted);
  }
  async function makeContainerSelector(container){
    let hsel = document.getElementById("hostSelector")
    let selectedHost = hsel.childNodes[0].value;
    if(!container) container = selectedHost;
    let i = u.fileInfo(container);
    let wanted=getWanted();
    if(!i.isContainer && i.url !=wanted.url) return makeProjectMenu(container);
    showFilePicker(zeditor.lastVisited);
    container = container.replace(/\/[^\/]*$/,'/');
    const ldp = UI.rdf.Namespace("http://www.w3.org/ns/ldp#");
    const base = UI.rdf.sym(container);
    await u.crossLoad(base,null,false);  // WHY DOES IT NEED false RELOAD?
    let files = UI.store.each(base,ldp("contains"));
    let resources = [];
    let containers=[];
    i = u.fileInfo(container);
    containers.push([i.url,i.label]);
    for(let file of files.sort()){
      let name = file.value
      let i = u.fileInfo(name);
      if(!name || i.isHidden) continue; 
      if(i.isContainer) containers.push([i.url,i.label]);
      else resources.push([i.url,i.label]);
    }
    let parent = u.getParent(base.uri);
    if(parent) {
      if(!parent.endsWith("//")) {
        let p = u.fileInfo(parent);
        containers.splice(1,0,[p.url,"../"]);
      }
    }
    let w = getWanted()||{};
    let c = w.host ?w.host.replace(/\/$/,'') + w.path :container;
    let r = w.url;
    await u.makeSelector(containers,async(e)=>{
      await makeContainerSelector(e);
      await makeResourceSelector(e)
    },c,"#containerSelector");
    await u.makeSelector(resources,async(e)=>{
      await loadZeditor(e)
    },r,"#resourceSelector",10);
  }
  async function makeResourceSelector(base){
    const ldp = UI.rdf.Namespace("http://www.w3.org/ns/ldp#");
    base ||= document.getElementById("containerSelector").childNodes[0].value;
    let storage = document.getElementById("hostSelector").childNodes[0].value;
    await u.crossLoad(base,null,false);
    let baseNode = UI.rdf.sym(base);
    let files = UI.store.each(baseNode,ldp("contains"));
    let select = document.createElement("SELECT");
    let resources = [];
    for(let file of files.sort()){
      let name = decodeURI(file.value)
      let i = u.fileInfo(name);
      if(!name || i.label.match(/(%23|~)$/)) continue;
      if(!i.isContainer)      
        resources.push([i.url,i.label]);
    }
    let w = getWanted()||{};
    await u.makeSelector(resources,async(e)=>{await loadZeditor(e)},w.url,"#resourceSelector",10);
    wantedURL="";
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
        if(newScreen==="display") hideFormEditor();
        zeditor.editor.setSize(newScreen==="editor" ?42 :20);
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

  function showProjectMenu(uri){
    addClass('#left-column','project');
    zeditor.lastVisited = zeditor.currentFile.url
    zeditor.currentProject=uri;
  }
  function showFilePicker(){
    removeClass('#left-column','project');
    zeditor.currentProject="";
  }
  function showFormEditor(){
    zeditor.formEditor = true;
    document.querySelector('#formInEditor').style.display="block";
  }
  function hideFormEditor(){
    zeditor.formEditor = false;
    document.querySelector('#formInEditor').style.display="none";
  }
  function toggleMenu(){
    let el = document.querySelector('#main-menu');
    let current = el.style.display || "none" ;
    if(current==="none") el.style.display="block";
    else el.style.display="none";
  }

  async function makeProjectMenu(url2open){
    url2open = decodeURI(url2open);
    showProjectMenu(url2open);
    await u.crossLoad(url2open);
    let project = u.getMainSubject(url2open);
    let type = u.getUItype(project);
    if(!type==="PageDefinition") return;
    let templateUrl = u.getObject(project,u.UIO('pageTemplate'));
    let template = await u.loadFile(templateUrl);
    let p = zeditor.currentProject = {
      url          : url2open,
      endpoint     : u.getObject(project,u.UIO('inputData')),
      inputForm    : u.getObject(project,u.UIO('inputForm')),
      outputPage   : u.getObject(project,u.UIO('outputPage')),
      components   : u.getObjects(project,u.UIO('component')),
      template : template || "",
      pageTemplate : templateUrl,
    }
    let components = "";
    for(let c of UI.store.match(project,u.UIO('component'))){
      let label = u.getObject(c.object,u.UIO('label'));
      let href = u.getObject(c.object,u.UIO('href'));
      components += `
  <button onclick="loadZeditor('${href}','both')">
    Edit ${label} template
  </button>
      `;
    };
    let menuStr = `
<div><b>Editor Tasks</b></div>
  <button class="selected" onclick="loadZeditor('${p.outputPage}','display')">
    View page as HTML
  </button>
  <button onclick="loadZeditor('${p.inputForm}','display')">
    Edit data (via form)
  </button>
  <button onclick="loadZeditor('${templateUrl}','both')">
    Edit page template
  </button>
  ${components}
<div><b>Admin Tasks</b></div>
  <button onclick="loadZeditor('${p.outputPage}','both','rdfa')">
    View page as RDF
  </button>
  <button onclick="loadZeditor('${p.endpoint}','both')">
    Edit data (raw)
  </button>
  <button onclick="loadZeditor('${p.inputForm}','both')">
    Edit form
  </button>
  <button onclick="loadZeditor('${p.url}','both')">
    Edit page definition
  </button>
  `;
  document.getElementById('project').innerHTML=menuStr;
  u.menuize('#project');
  loadZeditor(p.outputPage,'display')
  }



  async function init(){
    document.querySelector('#myContent').addEventListener("click",async()=>{
      document.getElementById('main-menu').style.display="none";
      await makeStorageMenu();
    });
    document.querySelector('#sharedContent').addEventListener("click",async()=>{ 
      document.getElementById('main-menu').style.display="none";
      await makeProjectMenu();
    });
    document.querySelector('.screen').addEventListener("click",async()=>{
      toggleScreens();
    });
/*
    (new Modal()).render({
      targetSelector : ".menu.button",
      label   : "\u2630",
      iframe : "templates/about.html",
      width   :  "90%",
      height  :  "85%",
    });
*/
    document.querySelector('.menu.button').addEventListener("click",async(e)=>{
      toggleMenu();
    });
    document.querySelector('.next').addEventListener("click",async(e)=>{
      navigate('next');
    });
    document.querySelector('.previous').addEventListener("click",async(e)=>{
      navigate('previous');
    });
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
    const params = new URLSearchParams(location.search)
    let url2open = params.get('url');
    u.menuize('#top-menu');
    if(url2open) await makeProjectMenu( url2open);
    else {
      await makeStorageMenu();
    }
    removeClass('#shadowBody',"loading");
  }

