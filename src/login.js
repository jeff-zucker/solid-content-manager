/*
  LOGIN
*/

var port =3101;
var host = `http://localhost:${port}`;
/*
solid-ui/login.ts, line 1157
  * if SolidAppContext.userRoles, set roles 
  * e.g. window.SolidAppContext.userRoles = ['PowerUser','Developer'];
*/
window.SolidAppContext = {
  noAuth : host,
  webId : host + "/profile/card#me",
  app : host,
  webid : host + "/profile/card#me",
}

document.addEventListener('DOMContentLoaded', function() {
    const authSession = UI.authn.authSession
    const loginButtonArea = document.getElementById("login");
    async function mungeLoginArea(){
      document.getElementById('shadowBody').classList.add("loading");
      const params = new URLSearchParams(location.search)
/*
      if(typeof window.zeditor==="undefined"){
        window.zeditor = localStorage.getItem("zeditor") || {
          editor : makeEditor("#editor","turtle"),
          currentProject : "",
          currentScreen : "display",
          currentFile : {},
          lastVisited : "",
          wantedURL : "",
        }
      }
*/
/*
      params.set('uri', uri);
      window.history.replaceState({}, '', `${location.origin}${location.pathname}?${params}`);
*/
      if(!loginButtonArea) return await solidUI.initApp();
      loginButtonArea.innerHTML="";
      loginButtonArea.appendChild(UI.login.loginStatusBox(document, null, {}))
      const signupButton = loginButtonArea.querySelectorAll('input')[1];
      if(signupButton) signupButton.style.display="none";
      let me = await UI.authn.checkUser();
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
/*
      let dev = UI.rdf.sym("http://www.w3.org/ns/solid/terms#Developer");
      let pow = UI.rdf.sym("http://www.w3.org/ns/solid/terms#PowerUser");
      let isa = UI.rdf.sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
      me ||= host + "/profile/card#me",
      UI.store.add(me,isa,dev);
      UI.store.add(me,isa,pow);
*/
      await solidUI.initApp();
    }      
    if (authSession && loginButtonArea) {
      loginButtonArea.style.display="none";
      authSession.onLogin(()=>{mungeLoginArea()});
      authSession.onLogout(()=>{mungeLoginArea()});
      authSession.onSessionRestore(()=>{mungeLoginArea()});
    }    
    mungeLoginArea();
}); 
