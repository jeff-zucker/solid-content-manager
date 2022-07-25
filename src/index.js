import './login.js';
import zeditor from './zeditor.js';

  async function toggleMenu(wantedMenu){
    wantedMenu ||= 'MainMenu';
    let kids = document.querySelector('#menuArea').childNodes;
    for(let kid of kids){
      if(kid.id===wantedMenu) kid.style.display="block";
      else kid.style.display="none";
    }
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
   await solidUI.activateComponent('#menuArea');
   await solidUI.activateComponent('#mainMenu');
   zeditor.create("#editor","turtle");
   document.querySelector('.screen').addEventListener("click",async()=>{
     zeditor.toggleScreens();
   });
   document.querySelector('.menu.button').addEventListener("click",async(e)=>{
     toggleMenu();
   });
   document.getElementById('save').addEventListener("click",(e)=>{
     zeditor.save("#e1");  
   });
   document.getElementById('shadowBody').classList.remove("loading");
  }
  solidUI.showFunction = zeditor.load.bind(zeditor);
  solidUI.initApp = init;
