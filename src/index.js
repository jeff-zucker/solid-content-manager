import './login.js';

  async function toggleMenu(wantedMenu){
    wantedMenu ||= 'MainMenu';
    // Hide Tabulator (redisplay later if a SolidOSLink
    document.getElementById('right-column-tabulator').style.display="none";
    document.getElementById('display').style.display="block";
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
  function toggleScreens(newScreen){
    let currentIsDisplay = document.body.classList.contains('display');
    if(!currentIsDisplay || newScreen==="display") {
      document.body.classList.remove("split");
      document.body.classList.add("display");
    }
    else {
      document.body.classList.remove("display");
      document.body.classList.add("split");
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
   document.querySelector('.screen').addEventListener("click",async()=>{
     toggleScreens();
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
   document.getElementById('shadowBody').classList.remove("loading");
   await solidUI.activateComponent('#menuArea');
   await solidUI.activateComponent('#mainMenu');
  }
  solidUI.initApp = init;
  solidUI.showTabulator = ()=>{
    document.getElementById('right-column-tabulator').style.display="block";
    document.getElementById('display').style.display="none";
  }
  solidUI.hideTabulator = ()=>{
    document.getElementById('right-column-tabulator').style.display="none";
    document.getElementById('display').style.display="block";
  }
