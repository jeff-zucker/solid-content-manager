import {selector} from    '../../solid-ui-components/src/view/selector.js';

  export async function containerSelector(url,targetSelector,resourceOnChange){
    const ldp = UI.rdf.Namespace("http://www.w3.org/ns/ldp#");
    if(!url) return "";
    let container = url.replace(/\/[^\/]*$/,'/'); // in case we get passed a resource
    let host = _host(container);
    const base = UI.rdf.sym(container);
    await UI.store.fetcher.load(base);
    let files = UI.store.each(base,ldp("contains"),null,base);
    let resources = [];
    let containers=[];
    containers.push({value:base.uri,label:_pathname(base.uri)});
    for(let file of files.sort()){
      let name = file.value
      // if(!name || i.isHidden) continue; 
      if(!name) continue; 
      if(name.endsWith('/')) containers.push({value:name,label:_pathname(name)});
      else resources.push({value:name,label:_pathname(name)});
    }
    let parent = base.uri.replace(/\/$/,'').replace(/\/[^\/]*$/,'/');
    if(parent) {
      if(!parent.endsWith("//")) {
        containers.splice(1,0,{value:parent,label:"../"});
      }
    }
    let x = ()=>{};
    let hostEl = document.createElement('DIV');
    hostEl.innerHTML = host;
    let containerOnchange = async (selectorElement)=>{
       let newContainer = selectorElement.value;
       return await containerSelector(newContainer,targetSelector);
    };
    containers = await selector(containers,containerOnchange,url,null,6)
    resources =  await selector(resources,resourceOnchange,url,null,12)
    containers.id = "containerSelector";
    resources.id = "resourceSelector";
    if(targetSelector && typeof targetSelector==="string") targetSelector = document.querySelector(targetSelector);
    let div = targetSelector ?targetSelector :document.createElement('DIV');
    div.innerHTML = "";
    div.appendChild(hostEl);    
    div.appendChild(containers);    
    div.appendChild(resources);    
console.log(div)
    return div;
  }
  function _pathname(path){
    try{ 
      let p = new URL(path); 
      return p.pathname
    }
    catch(e){console.log(path,e); return path }; 
  }
  function _host(path){
    try{ 
      let p = new URL(path); 
      return p.host
    }
    catch(e){console.log(path,e); return path }; 
  }



