import { getCookie } from './../helpers/cookieHelpers.js';
import { sendWithToken, getWithToken } from './../helpers/APIHelpers.js';

class ActionManager {
  constructor() {
    this.states = {
      raise_hand: false,
      unclear: false,
      show_me: false,
      too_fast: false
    }

    this.restoreFromAPI();

    for(let state in this.states) {
      const element = document.getElementById(state);
      element.addEventListener('click', this.handleClick.bind(this))
    }
  }
  handleClick(e) {
    e.preventDefault()
    const local_state = e.target.id;
    this.states[local_state] = !this.states[local_state]
    sendWithToken("actions/request", {request: local_state, active: this.states[local_state]})
    this.updateStates();
  }
  restoreFromAPI() {
    getWithToken("actions/request", (response) => {
      console.log("response", response)
      response.forEach((e) =>{
        this.states[e.request] = e.active;
      })
      this.updateStates()
    })

  }
  updateStates() {
    for(let state in this.states) {
      const element = document.getElementById(state);
      element.className =  this.states[state] ? "action active" : "action"
    }
  }
}

export default ActionManager;