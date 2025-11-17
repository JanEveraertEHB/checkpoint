import { sendWithToken, getWithToken } from './../helpers/APIHelpers.js';


class CheckinManager {
  constructor() {
    document.getElementById('checkin').addEventListener('click', this.handleClick.bind(this))
  }
  handleClick(e) {
    const statusBar = document.getElementById('status-bar');

    sendWithToken("actions/checkin", {checkin: "0"}, 
      (data) => {
        if(data.message == "success") {
          statusBar.textContent = 'Checkin received!';
          statusBar.className = 'status-bar success';
        } else {
          statusBar.textContent = 'Something went wrong!';
          statusBar.className = 'status-bar error';
        }
      },
      (err) => {
        statusBar.textContent = 'Something went wrong!';
        statusBar.className = 'status-bar error';

      }
    );
  }
}

export default CheckinManager;