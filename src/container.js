import {CU} from    '../../solid-ui-components/src/utils.js';
let u = new CU();

//alert(container)

export class containerSelector {

  async function render(container){
    const ldp = UI.rdf.Namespace("http://www.w3.org/ns/ldp#");
    if(!container) return "";
    container = container.replace(/\/[^\/]*$/,'/'); // in case we get passed a resource
    const base = UI.rdf.sym(container);
    await UI.store.fetcher.load(base);
    let files = UI.store.each(base,ldp("contains"));
    let resources = [];
    let containers=[];
    containers.push([base.url,mungePath(base.url)]);
    for(let file of files.sort()){
      let name = file.value
      // if(!name || i.isHidden) continue; 
      if(!name) continue; 
      if(name.endsWith('/')) containers.push([name,mungePath(name)]);
      else resources.push([name,mungePath(name)]);
    }
    let parent = base.uri.replace(/\/$/,'').replace(/\/[^\/]*$/,'/');
    if(parent) {
      if(!parent.endsWith("//")) {
        containers.splice(1,0,[parent,"../"]);
      }
    }
    console.log(containers,resources);
    return;
    window.zeditor ||= localStorage.getItem("zeditor") || {};
    let w = window.zeditor.wantedURL||{};
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
  async makeResourceSelector(base){
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
    let w = window.zeditor.wantedURL||{};
    await u.makeSelector(resources,async(e)=>{await loadZeditor(e)},w.url,"#resourceSelector",10);
//    window.zeditor.wantedURL="";
  }
}

