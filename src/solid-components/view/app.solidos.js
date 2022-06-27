import {createLoginBox,applyProfile} from '../databrowser.js';
/*
<div id = "solid-main-app"
             data-type "ui:Theme"
             data-name "solidos-0.1"
           data-author "Jeff Zucker"
    data-selBackground "#77b"
  data-unselBackground "#aac"
       data-unselColor "black"

>
*/
export class App {
  async render(solidUI,app){
    let appString = "";
    try {      
     //let response=await panes.UI.store.fetcher.webOperation('GET',app.theme);
      let response = await window.fetch(app.theme);
      appString = solidUI.fillTemplate(await response.text(),[app]);
    }
    catch(e){console.log(e)}
    app = solidUI.setDefaults(app);
    let element = solidUI.createElement('SPAN','',appString);
/*
currentPodMenu
userMenu
initialContent
    podRoot   : storage,
    podName   : me.name,
    podNick   : me.nick,
    podWebid  : me.webId,
    podImage  : me.image,
    podInbox  : me.inbox,
    podProfile : me.webId,

hard-coded
  solidLogo
  loginBox
on pod-load
  get currentPod root,name,nick,webid,image,inbox
  fill 
on login
  get currentUser root,name,nick,webid,image,inbox
*/

    // solidLogo
    //
    let solidLogo = element.querySelector('#solidLogo')
    if(solidLogo) solidLogo.src = 'https://solidproject.org/assets/img/solid-emblem.svg';

    // currentPodMenu
    //
/*
    let menuElement = element.querySelector("#currentPodMenu");
    if( app.orientation==="vertical"){
      menuElement = element.querySelector("NAV");
    }
    const menu = await solidUI.processComponent(menuElement,app.currentPodMenu);
    if(menu && menuElement) menuElement.appendChild(menu);


    // userMenu
    //
    if(app.userMenu) {
      const amenu = await solidUI.processComponent(menuElement,app.userMenu);
      let umenu = element.querySelector('#userMenu')
      if( umenu) umenu.appendChild(amenu);
    }
*/
    // loginBox & initialContent
    //
    if(app.loginBox) await createLoginBox(element);
    await applyProfile(element,'','appLoad'); // munge site menu

/*
    if(app.initialContent) {
      let content = await solidUI.getComponentHash(app.initialContent);
      content = content.content.interpolate(solidUI.vars)
      let main = element.querySelector('#mainMain');
      if(main) main.innerHTML = content;
    }
*/
//console.log(element);
    element = await solidUI.initInternal(element);  
//console.log(nel);
    return element;
  }
}
































































