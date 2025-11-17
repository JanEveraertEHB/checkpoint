
import ActionManager from "./managers/ActionManager.js"
import CheckinManager from "./managers/CheckinManager.js"
import LoginManager from "./managers/LoginManager.js";
import MessageManager from "./managers/MessageManager.js"

import {getCookie, setCookie} from "./helpers/cookieHelpers.js";

window.addEventListener('DOMContentLoaded', () => {

	const actionManager = new ActionManager();
	const checkinManager = new CheckinManager();
	const loginManager = new LoginManager();
	const messageManager = new MessageManager();

});