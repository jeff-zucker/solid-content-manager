/*
  LOGIN
*/
    const authSession = UI.authn.authSession
    const loginButtonArea = document.getElementById("login");
    async function mungeLoginArea(){
      document.getElementById('shadowBody').classList.add("loading");
      const params = new URLSearchParams(location.search)
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
/*
      params.set('uri', uri);
      window.history.replaceState({}, '', `${location.origin}${location.pathname}?${params}`);
*/
      document.getElementById('e1').display="none";
      if(!loginButtonArea) return solidUI.initApp();
      loginButtonArea.innerHTML="";
      loginButtonArea.appendChild(UI.login.loginStatusBox(document, null, {}))
      const signupButton = loginButtonArea.querySelectorAll('input')[1];
      if(signupButton) signupButton.style.display="none";
      const me = await UI.authn.checkUser();
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
      await solidUI.initApp();
    }      
    if (authSession && loginButtonArea) {
      loginButtonArea.style.display="none";
      authSession.onLogin(()=>{mungeLoginArea()});
      authSession.onLogout(()=>{console.log("");mungeLoginArea()});
      authSession.onSessionRestore(mungeLoginArea);
    }    
    mungeLoginArea();
 
