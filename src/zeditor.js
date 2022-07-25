/*
load
save
create
saveOutputPage
showOutputPage
showRDFa
showInEditor
showFormEditor
hideFormEditor
*/
class Zeditor {

  create(targetSelector,type){
    this.editor = new AceShim(targetSelector);
    this.editor.setTheme("cobalt");
    this.editor.setKeys("zemacs");
    if(type==="rdf") type = "turtle";
    if(type==="graphviz") type = "dot";
    this.editor.setMode(type); // javascript,turtle,dot,markdown,html,css
    this.editor.ed.setOption("wrap",true);
    this.editor.ed.focus();
    this.currentProject = "";
    this.currentScreen = "display";
    this.currentFile = {};
    this.lastVisited = "";
    this.wantedURL = "";
  }

  setSize(size){
    this.editor.ed.size = size;
  }

  async load(contentType,uri,targetSelector){
    if(typeof uri !="string") uri = uri.url || uri.uri;
    let i = await solidUI.util.loadFile(uri); 
    if(!i || !i.ok) return;
    let string = i.body;
    let UItype;
    if(i.type==="rdf"){
      i = await solidUI.util.crossLoad(uri,string);
      UItype = solidUI.util.getUItype(uri);
    }
    this.currentFile = i;
// SHOW IN DISPLAY
//    if(!screen || screen!="editor") {
      let displayString = string;
      let displayUri = uri;
      let displayCtype = i.contentType;
       //  show project.outputPage on top, edit project.template on bottom
       //
      if(this.currentProject &&this.currentProject.pageTemplate===i.url){
        let outputPage = this.currentProject.outputPage;
        let r = await solidUI.util.loadFile(this.currentProject.outputPage);
        displayString = r.body;
        displayUri = outputPage
        displayCtype = r.contentType;
      }
      await solidUI.util.show(displayCtype,displayUri,displayString,"#display",true)
//    }
// SHOW IN EDITOR
    document.querySelector(".menu .url").innerHTML = i.url;
    this.currentFileURL = i.url;
    this.UItype = UItype;
    if(UItype==="DataTemplate"){
      const form = await (new Form()).render({
        form:window.origin+"/solid/solid-ide/templates/sparql-form.ttl#this",
        formSubject:solidUI.util.getMainSubject(uri),
      });
      let el = document.querySelector("#formInEditor");
      el.innerHTML = "";
      el.appendChild(form);
      this.showFormEditor();
      return
    }
    else this.hideFormEditor();
//    if(i.editable) {
      this.currentFileUrl = i.url;
      this.UItype = UItype;
/*      if(format && format==="rdfa"){
        showRDFa(uri);
      }
*/
//      if(!screen || screen!="display") {
        await this.showInEditor(uri,string,i);
//      }
//    }
//    else{
//      this.toggleScreens('display');
//    }
  }


  // SAVE
  //
  async save(){
    let uri = this.currentFileUrl;
    let string = this.editor.getContents();
    let i = this.currentFile;

    // IF NOT IN FORM-EDITOR, SAVE THE CURRENT EDITOR CONTENT
    //
    if(!this.formEditor) { // don't save forms, they save themselves
      try {
        let response = await solidUI.util.PUT(i.url,string,i.contentType);
        if(!response.ok) alert(response)
//        else u.show(i.contentType,i.url,string,"#display",true);
      }catch(e){console.log(e); }
    }

    // IF PROJECT, ALSO SAVE PROJECT OUTPUT PAGE
    //
    let outputString = this.currentProject ?await saveOutputPage(this.currentProject,string) :"";

    // RE-DISPLAY CURRENT EDITOR CONTENT IN DISPLAY AREA
    //
    if(this.currentProject){
      if(this.currentProject.pageTemplate===i.url){
        await showOutputPage(this.currentProject)
      }
      else 
        if(this.UItype==="DataTemplate")
          await solidUI.util.show(i.contentType,i.url,null,"#display",true);
        else
          await solidUI.util.show(i.contentType,i.url,string,"#display",true);
    }
    else 
      await solidUI.util.show(i.contentType,i.url,string,"#display",true);
  }

  async showOutputPage(project){ 
    await solidUI.util.crossLoad(project.url);
    await solidUI.util.show("text/html",project.outputPage,null,"#display",true); 
  }
  async saveOutputPage(project,string){ 
    let generated = (await solidUI.util.show("rdf",project.url,null,null,true));
    if(typeof generated !="string") generated = generated.outerHTML;
    try {
      let r = await solidUI.util.PUT(project.outputPage,generated,'text/html');
      if(!r.ok) alert(r);
      else { return generated; }
    }catch(e){console.log(e); return; }
  }
  async showRDFa(uri){
    // uri ||= document.querySelector(`#e1 .url`).innerHTML;
    uri ||= this.currentFileURL;
    try {
      let r = await UI.store.fetcher.webOperation("GET",uri,{headers:{Accept:"text/turtle"}});
      if(r.ok){
        solidUI.util.show("text/turtle",uri,r.responseText,"#display",true);
      }
      else alert(r);
    }catch(e){console.log(e); return; }
  }
  showInEditor(uri,string,fileInfo){
    this.currentFileUrl = fileInfo.url;
    this.editor.setContents(string);
    document.querySelector('#editor').focus();
    this.editor.ed.focus();
    this.editor.ed.moveCursorTo(0,0);
  }
  showFormEditor(){
    this.formEditor = true;
    let elm = document.querySelector('#formInEditor')
    if( elm) elm.style.display="block";
  }
  hideFormEditor(){
    this.formEditor = false;
    let elm = document.querySelector('#right-column #formInEditor')
    if(elm) elm.style.display="none";
  }
  toggleScreens(newScreen){
    let current = document.body.classList;
    if(current.length===0){
      solidUI.util.addClass('body',"both");
      current = document.body.classList;
    }
    if(newScreen){
      if(typeof newScreen==="object") newScreen = newScreen.screen;
      for(let s of ["both","display","editor"]) solidUI.util.removeClass("body",s);
      solidUI.util.addClass("body",newScreen);
      if(newScreen==="display"){
        hideFormEditor();
      }
      else zeditor.setSize(newScreen==="editor" ?42 :20);
      return;
    }
    if(current.contains('editor')) {
      solidUI.util.removeClass("body","editor");
      solidUI.util.addClass("body","display");
    }
    else if(current.contains('display')) {
      solidUI.util.removeClass("body","display");
      solidUI.util.addClass("body","both");
      zeditor.setSize(20);
    }
    else if(current.contains('both')) {
      solidUI.util.removeClass("body","both");
      solidUI.util.addClass("body","editor");
      zeditor.setSize(42);
    }
  }

}


let zeditor = new Zeditor();
export default zeditor;
// ENDS
