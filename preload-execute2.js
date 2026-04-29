const { contextBridge, ipcRenderer } = require('electron');

try {
  contextBridge.executeInMainWorld({
    func: (alertFn) => {
      window.alert = alertFn;
      console.log('alert overridden');
    },
    args: [(msg) => {
      console.log('IPC alert called with:', msg);
      return "SUCCESS";
    }]
  });
} catch (e) {
  console.log('executeInMainWorld failed:', e.message);
}
