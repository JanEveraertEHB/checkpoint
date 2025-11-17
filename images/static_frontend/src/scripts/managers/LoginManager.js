import { setCookie, getCookie } from './../helpers/cookieHelpers.js';
import { sendWithToken, getWithToken } from './../helpers/APIHelpers.js';

class LoginManager {
  constructor() {
    this.token = getCookie("token");

    document.getElementById("submitLogin").addEventListener("click",  this.loginSubmitHandler.bind(this))
    document.getElementById("submitRegister").addEventListener("click", this.registerSubmitHandler.bind(this))

    document.getElementById("showRegister").addEventListener("click", (e) =>{
      document.getElementById('loginForm').style.display = "none";
      document.getElementById('registerForm').style.display = "block";
    })
    document.getElementById("showLogin").addEventListener("click", (e) =>{
      document.getElementById('loginForm').style.display = "block";
      document.getElementById('registerForm').style.display = "none";
    })

    
    if(this.token.length > 0) {
      // validate
      getWithToken("students/validate", (data) => {
        if(data.uuid) {
          document.getElementById('overlay').style.display = "none"
          document.getElementById("user").innerHTML = data.first_name + " " + data.last_name
        }
      });
    }
  }
  registerSubmitHandler(e) {
    const first_name = document.getElementById('registerFirstname').value;
    const last_name = document.getElementById('registerLastname').value;
    const classgroup = document.getElementById('registerClass').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPass').value;
    const hash = CryptoJS.MD5(password).toString();
    console.log("should be removed")

    fetch("http://" + window.location.hostname + ":3000/students/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          first_name: first_name, 
          last_name: last_name,
          email: email, 
          password: hash,
          class: classgroup


        })

      })
      .then(r => r.json())
      .then(data => {
        console.log(data)
        setCookie({
          name: 'token',
          value: data.token
        })
        document.getElementById('overlay').style.display = "none"
        document.getElementById("user").innerHTML = data.first_name + " " + data.last_name
      })
      .catch((e) => {
        console.log(e)
        console.error("wrong credentials")
      })
  }
  loginSubmitHandler(e) {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    var passhash = CryptoJS.MD5(pass).toString();
    this.login(email, passhash);
  }

  login(email, pass) {
    fetch("http://" + window.location.hostname + ":3000/students/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email, 
        password: pass
      })
    })
      .then(r => r.json())
      .then(data => {
        if(data.message != "wrong credentials") {
          setCookie({
            name: 'token',
            value: data.token
          })
          document.getElementById('overlay').style.display = "none"
          document.getElementById("user").innerHTML = data.first_name + " " + data.last_name
        }
      })
      .catch((e) => {
        console.error("wrong credentials")
      })
  }
  handleClick(e) {
  }
}

export default LoginManager;