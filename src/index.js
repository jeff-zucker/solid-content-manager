import './login.js';
import zeditor from './zeditor.js';

  async function toggleMenu(wantedMenu){
    wantedMenu ||= 'MainMenu';
    
    // Hide Tabulator (redisplay later if a SolidOSLink
    //
    document.getElementById('right-column-tabulator').style.display="none";
    document.getElementById('display').style.display="block";
    // document.getElementById('right-column').style.display="block";

    document.querySelector('#menuArea').style.display="block";
    document.querySelector('#manageMenuArea').style.display="none";
    document.querySelector('#toolsMenuArea').style.display="none";
    let kids = document.querySelector('#menuArea').childNodes;
    for(let kid of kids){
      if(kid.id==="login") continue;
      if(kid.id===wantedMenu) kid.style.display="block";
      else kid.style.display="none";
    }
  }
  async function toggleManageMenu(){
    document.querySelector('#menuArea').style.display="none";
    document.querySelector('#toolsMenuArea').style.display="none";
    document.querySelector('#manageMenuArea').style.display="block";
    await solidUI.activateComponent('#manageMenuArea');
  }
  async function toggleToolsMenu(){
    document.querySelector('#menuArea').style.display="none";
    document.querySelector('#manageMenuArea').style.display="none";
    document.querySelector('#toolsMenuArea').style.display="block";
    await solidUI.activateComponent('#toolsMenuArea');
  }
  function navigate(direction) {
      let el = document.querySelector('#resourceSelector select');
      let max = el.childNodes.length;
      let current = el.selectedIndex;
      let next = current<max-1 ?current+1 :0;
      if(direction==="previous") next = current>0 ?current-1 :max-1;
      el.selectedIndex=next;
      zeditor.load(el[el.selectedIndex].value);
  }
  async function init(){
   zeditor.create("#editor","turtle");
   document.querySelector('.screen').addEventListener("click",async()=>{
     zeditor.toggleScreens();
   });
   document.querySelector('.menu.button').addEventListener("click",async(e)=>{
     toggleMenu();
   });
   document.querySelector('.gear.button').addEventListener("click",async(e)=>{
     toggleManageMenu();
   });
   document.querySelector('.wrench.button').addEventListener("click",async(e)=>{
     toggleToolsMenu();
   });
   document.getElementById('save').addEventListener("click",(e)=>{
     zeditor.save("#e1");  
   });
   document.getElementById('shadowBody').classList.remove("loading");
   await solidUI.activateComponent('#menuArea');
   await solidUI.activateComponent('#mainMenu');
  }
  solidUI.showFunction = zeditor.load.bind(zeditor);
  solidUI.initApp = init;
  solidUI.showTabulator = ()=>{
    document.getElementById('right-column-tabulator').style.display="block";
    document.getElementById('display').style.display="none";
  }
  solidUI.hideTabulator = ()=>{
    document.getElementById('right-column-tabulator').style.display="none";
    document.getElementById('display').style.display="block";
  }
