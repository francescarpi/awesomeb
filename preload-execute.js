const { contextBridge, ipcRenderer } = require('electron');

try {
  contextBridge.executeInMainWorld({
    func: (alertFn) => {
      window.alert = alertFn;
      console.log('alert overridden');
    },
    args: [(msg) => {
      console.log('custom alert called with:', msg);
    }]
  });
} catch (e) {
  console.log('executeInMainWorld failed:', e.message);
}
