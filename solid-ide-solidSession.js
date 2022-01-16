/* START OF SESSION FUNCTIONS */
const defaultPopupUri = 'https://solidcommunity.net/common/popup.html' //'https://solid.community/common/popup.html'

var SolidSession = function(auth) {
	
  var self= this
	self.log = function(msg){console.log(msg) }
  this._auth = auth
	
	/**
   * Redirect the user to a login page if in the browser
   * or login directly from command-line or node script
   *
   * @param {LoginCredentials} credentials
   * @returns {Promise<Session>}
   */
/* this.login = async (credentials) => {
  let session = await self._auth.currentSession()
  if (!session) {
    session = await self._auth.login(credentials)
  }
  return session.webId
} */

  /**
   * Open a popup prompting the user to login
   * @param {string} [popupUri]
   * @returns {Promise<string>} resolves with the webId after a
   * successful login
   */
/* this.popupLogin = async (popupUri = defaultPopupUri) => {
  let session = await self._auth.currentSession()
  if (!session) {
    if (typeof window === 'undefined') {
      session = await self._auth.login(popupUri)
    } else {
    session = await self._auth.popupLogin({ popupUri })
    }
  }
  return session.webId
} */
this.popupLogin = async () => {
  const loginUrl = self.getLoginUrl()
  alert('loginUrl ' + loginUrl + ' ' + window.location.href.split('?')[0])
  await self._auth.login({
      oidcIssuer: loginUrl,
      redirectUrl: window.location.href.split('?')[0],
      clientName: 'Hello World',
  });
  return self.checkSession()
}

this.getLoginUrl = () => {
  // Asking for a login url in Solid is kind of tricky. In a real application, you should be
  // asking for a user's webId, and reading the user's profile you would be able to obtain
  // the url of their identity provider. However, most users may not know what their webId is,
  // and they introduce the url of their issue provider directly. In order to simplify this
  // example, we just use the base domain of the url they introduced, and this should work
  // most of the time.
  const url = prompt('Introduce your Solid login url');

  if (!url)
      return null;

  const loginUrl = new URL(url);
  loginUrl.hash = '';
  loginUrl.pathname = '';

  return loginUrl.href;
}

  /**
   * Return the currently active webId if available
   * @returns {Promise<Session|undefined>} session if logged in, else undefined
   */
/* this.checkSession = async () => {
  const session = await self._auth.currentSession()
  if (session) return session.webId
  else return undefined
} */
this.checkSession = async () => {
  // This function uses Inrupt's authentication library to restore a previous session. If you were
  // already logged into the application last time that you used it, this will trigger a redirect that
  // takes you back to the application. This usually happens without user interaction, but if you hadn't
  // logged in for a while, your identity provider may ask for your credentials again.
  //
  // After a successful login, this will also read the profile from your POD.
  //
  // @see https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/authenticate-browser/
	alert('auth ' + Object.keys(self._auth))
	if (self._auth.getDefaultSession?.info?.isLoggedIn) {
		let webId = self._auth.getDefaultSession.info.webId
		self.log('webId ' + webId)
		return webId
	}
  try {
      await self._auth.handleIncomingRedirect({ restorePreviousSession: true });

      const session = self._auth.getDefaultSession();
      alert('session.info.isLoggedIn ' + session.info.isLoggedIn)
      if (!session.info.isLoggedIn)
          return false;

      user = session.info.webId // await fetchUserProfile(session.info.webId);

      return user;
  } catch (error) {
      alert(error.message);

      return false;
  }
}

  /**
   * Return the currently active session if available
   * @returns {Promise<Session|undefined>} session if logged in, else undefined
   */
/* this.currentSession = async () => {
  return self._auth.currentSession()
} */

  /**
     * Get credentials from the current session
     * @param {any} fn
     * @returns {object}
     */
/* this.getCredentials = (fn) => {
  return self._auth.getCredentials(fn)
} */

  /**
   * Logout the user from the pod
   * @returns {Promise<void>}
   */
this.logout = () => { // alain valid for legacy and DPoP
  return self._auth.logout()
}

return this
}
/* END OF SESSION FUNCTIONS */
