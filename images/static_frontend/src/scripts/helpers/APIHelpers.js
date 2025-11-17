import { getCookie, setCookie} from './cookieHelpers.js'

async function sendWithToken(endpoint, body, callback = ()=> {}, err = ()=> {}) {
  const c = getCookie("token")
  if(c.length > 0) {
    const token = c;
    await fetch(window.location.protocol + "//" + window.location.hostname + ":3000/" + endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' ,
          "Authorization": token

        },
        body: JSON.stringify(body)
    })
    .then(r => r.json())
    .then((data) => {
      callback(data);
    })
    .catch((error) => {
      err(error)
    });
  }
}

async function getWithToken(endpoint, cb) {
  const c = getCookie("token")
  if(c.length > 0) {
    const token = c;
    fetch(window.location.protocol + "//" + window.location.hostname + ":3000/" + endpoint, {
        headers: { 
          'Content-Type': 'application/json' ,
          "Authorization": token
        }
    })
    .then(r => r.json())
    .then((data) => {
      cb(data)
    })
    .catch(console.error);
  }
}


export {
  sendWithToken, getWithToken
}