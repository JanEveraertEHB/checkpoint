import { getCookie } from './../helpers/cookieHelpers.js';
import { sendWithToken, getWithToken } from './../helpers/APIHelpers.js';

const messageInput = document.getElementById('message');
const submitInput = document.getElementById('submitquestion');
const statusBar = document.getElementById('status-bar');

class MessageManager {
  constructor() {
    messageInput.addEventListener('keypress', this.handleKeyPress.bind(this));
    submitInput.addEventListener('click', this.handleClick.bind(this))
  }
  handleKeyPress(e) {
    if (e.key === 'Enter' && messageInput.value.trim() !== '') {
      e.preventDefault();
      this.sendMessage();
    }
  }
  handleClick(e){
    if (messageInput.value.trim() !== '') {
      e.preventDefault();
      this.sendMessage();
    }
  }
  
  sendMessage() {
    const message = messageInput.value.trim();
    sendWithToken("actions/questions", { question: message }, 
      (data) => {
        if(data.message == "success") {
          statusBar.textContent = 'Message received!';
          statusBar.className = 'status-bar success';
        } else {
          statusBar.textContent = 'Something went wrong!';
          statusBar.className = 'status-bar error';
        }
      }, 
      (error) => {
        statusBar.textContent = 'Something went wrong!';
        statusBar.className = 'status-bar error';

      });
  };
}

export default MessageManager;