import {LoadProfile} from '../node_modules/solid-load-profile/src/loadProfile.js';
import {CU} from    '../../solid-ui-components/src/utils.js';
let u = new CU();

let wantedURL = window.origin + "/solid/solid-ide/examples/test.gv";
function getWanted(){ return u.fileInfo(wantedURL) }

export  async function makeStorageMenu(container){
    window.zeditor.currentProject="";
    document.getElementById('left-column').classList.remove('project');
    let hosts = await ensureConfiguration(window.origin+"/profile/card#me");
    let wanted=getWanted();
    u.makeSelector(hosts,async(e)=>{await makeContainerSelector(e)},wanted.host,"#hostSelector");
    await makeContainerSelector(wanted.url,window.zeditor);
    await loadZeditor(wanted);
    return window.zeditor;
  }
  async function makeContainerSelector(container){
    let hsel = document.getElementById("hostSelector")
    let selectedHost = hsel.childNodes[0].value;
    if(!container) container = selectedHost;
    let i = u.fileInfo(container);
    let wanted=getWanted();
    if(!i.isContainer && i.url !=wanted.url) return makeProjectMenu(i.url,window.zeditor);
    showFilePicker(window.zeditor.lastVisited);
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
console.log(structure)
      return storages.concat(types.instances);
    }

  function showFilePicker(){
    document.getElementById('left-column').classList.remove('project');
    zeditor.currentProject="";
  }
