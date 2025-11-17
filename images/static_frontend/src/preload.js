const { contextBridge, ipcRenderer, systemPreferences } = require('electron')


window.addEventListener('DOMContentLoaded', () => {
  // console.log(systemPreferences)
  // if(!systemPreferences.getMediaAccessStatus("microphone")) {
  //   systemPreferences.askForMediaAccess("microphone")
  // }
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }


})

contextBridge.exposeInMainWorld('electronAPI', {
  getCookies: () => ipcRenderer.invoke('get-cookies'),
  setCookie: (cookie) => ipcRenderer.invoke('set-cookie', cookie)
})