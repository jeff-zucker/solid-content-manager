import {createLoginBox,applyProfile} from '../databrowser.js';

export class App {
  async render(solidUI,app){

    // GET/SET DEFAULTS
    //
    app = solidUI.setDefaults(app);
    if(app.fullPage){
      window.addEventListener('resize',()=>{
         app = mainHeight(app);
         let mm = document.getElementById('mainMain')
         let tab = document.getElementById('suicTabulator')
         if(mm) mm.style.height = app.mainHeight;
         if(tab) tab.style.height = app.mainHeight;
      });
      document.body.style.overflow="hidden";
    }

    // FIND NUMBER OF PIXELS IN 1 REM - VARIES WITH BROWSER/USER SETTINGS
    function rem2px(){
      let el = document.createElement('DIV');
      el.style="height:1rem";
      document.body.appendChild(el);
      let remSize = el.clientHeight;
      document.body.removeChild(el);
      return(remSize);
    }
    // SET BODY HEIGHT TO WINDOW HIEGHT MINUS HEADER + MENU 
    function mainHeight(app){
      let rem = rem2px();
      app.menuHeight = 2*rem;
      app.headerHeight = 6*rem;
      window.SolidAppContext = { scroll : app.headerHeight }
      app.mainHeight = ( window.innerHeight-app.headerHeight )
      app.headerHeight = app.headerHeight.toString()+'px';
      app.mainHeight = app.mainHeight.toString()+'px';
      return app;
    }
    app = mainHeight(app);

    // DISPLAY HEADER IF app.logo OR app.title
    //
    app.logo ||= "";
    app.title ||= "";
    app.headerHeight = ( app.logo || app.title || app.adminMenu ) ?app.headerHeight : "0";

    // DISPLAY MENU AT TOP OR LEFT DEPENDING ON app.orientation
    //
    app.leftMenu = "" ;
    app.siteMenu = "" ;
    if(app.orientation==="horizontal"){
      app.leftMenuStyle = "display:none";
    }
    else {
      app.leftMenuStyle = `
        display:block;
        width:36vw !important;
        height:${app.mainHeight};
        overflow-y:scroll;
        margin:0;
        padding:0;
      `;
    }

    let appString = await this.getHTML(app);
    let element = solidUI.createElement('SPAN','',appString);
    let solidLogo = element.querySelector('#solidLogo')
    if(solidLogo) solidLogo.src = 'https://solidproject.org/assets/img/solid-emblem.svg';

//    if(typeof app.currentPodMenu==='object')app.currentPodMenu.target = element.querySelector('.main');
    let menuElement = element.querySelector("#currentPodMenu");
    if( app.orientation==="vertical"){
      menuElement = element.querySelector("NAV");
    }
    const menu = await solidUI.processComponent(menuElement,app.currentPodMenu);
    if(menu && menuElement) menuElement.appendChild(menu);
    if(app.userMenu) {
      const amenu = await solidUI.processComponent(menuElement,app.userMenu);
      let umenu = element.querySelector('#userMenu')
      if( umenu) umenu.appendChild(amenu);
    }
    if(app.loginBox) await createLoginBox(element);
    await applyProfile(element); // munge site menu
    if(app.initialContent) {
      let content = await solidUI.getComponentHash(app.initialContent);
      content = content.content.interpolate(solidUI.vars)
      let main = element.querySelector('#mainMain');
      if(main) main.innerHTML = content;
    }
    return element;
  }

rem2vw(rem) {
  const viewportWithoutScroll = document.body.clientWidth;
  const pxPerVw = 100/viewportWithoutScroll;
  return( rem * pxPerVw);  
}
rem2vh(rem) {
  const viewportWithoutScroll = window.innerHeight;
  const pxPerVw = 100/viewportWithoutScroll;
  return( rem * 16 * pxPerVw);  
}
  async getHTML(app){ 
     app.leftColumnColumnStyle ||= "display:none";
     app.leftColumnColumnMenu ||= "";
     app.siteMenu ||= "";
     app.leftColumnColumnStyle ||= "";
     app.iframeSrc ||= "";
     app.iframeContent ||= "";
     app.logoStyle = `
             height: 3rem;
            display: inline-block;
       padding-left: 0.5rem;
     `;
     app.titleStyle = `
       display:inline-block;
       vertical-align:top; align:left;
       font-size: 2rem;
       padding-top: 0.4rem;
       padding-left:1rem;"
     `;
     app.appStye = `
              display: flex;
       flex-direction: column;
                width: 100%;
               height: 100%;
     `;
      app.mainStyle = `
        padding:0rem;
        width:100%;
        overflow:scroll;
        position:absolute;
        top:${app.headerHeight} !important;
        left:0;
        height:${app.mainHeight};
     `;
     if(app.theme) {
        try {      
//          let response = await panes.UI.store.fetcher.webOperation('GET',app.theme);
          let response = await window.fetch(app.theme);
          let content = await response.text();
          content = solidUI.fillTemplate(content,[app]);
          return await content;
        }
        catch(e){console.log(e)}
     }
return "";
     return `
<!--APP-->
<div class="solid-uic-app solid-main-app">

    <!--BANNER-->
    <div class="app-banner">

        <!--USER IMAGE & NAME-->  
        <img id="currentPodLogo" src="">
        <div id="currentPodTitle"></div>


        <!--ADMIN MENU, LOGIN, SOLID LOGO-->
        <div style="background:${app.unselBackground};text-align:center;position:absolute;top:0.5rem;right:7rem;"><span id="adminMenu" style="white-space: nowrap;"></span> </div>
        <div id="loginArea"></div>
        <img src="${app.logo}" style="height:7rem;position:absolute;top:-0.5rem;right:-0.5rem">

        <!--PUBLIC MENU-->
        <div id="currentPodMenu" style="white-space:nowrap;position:absolute;top:3rem;left:7.4rem;">${app.siteMenu}</div>

    </div><!--BANNER-->

    <!--MAIN WRAPPER-->
<!--    <div style="display:flex;flex-direction:row;width:100%;height:100%;"> -->
    <div style="width:100%;height:100%;min-height:0;">

        <!-- LEFT COLUMN MENU (IF EXISTS) -->
        <div class="leftColumn" style="${app.leftMenuStyle}">${app.leftMenu}</div>

        <!--MAIN MAIN-->
        <div id="mainMain" style="min-height:0;${app.mainStyle}"></div>

        <!--MAIN TABULATOR-->
            <div class="TabulatorOutline" role="main" id="suicTabulator" style="${app.mainStyle}">
                <table id="outline"></table>
                <div id="GlobalDashboard"></div>
            </div>

    </div><!--MAIN WRAPPER-->

</div><!--APP-->
<style>
  #suicTabulator{
    top:${app.headerHeight} !important;
    overflow:scroll !important;
    min-height: 0; 
  }
  #suicTabulator table {
    background:#7e7e7e !important;
    color:white !important;
  }
  .solid-main-app {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }
  .solid-main-app .app-banner {
     width:100%;
     display:flex;
     background:${app.unselBackground};
     color:black;
  }
  .solid-main-app input[type="button"]:hover {
    background:${app.selBackground};
    color:${app.selColor};
  }
  .solid-main-app #currentPodTitle {
    left:8rem;
    font-size:1.3rem;
    position:absolute;
    top:1rem;
  }
  .solid-main-app #currentPodLogo {
    height:${app.headerHeight}
  }
</style>

    `;
  }
}


































































