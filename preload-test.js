const { contextBridge } = require('electron');
try {
  contextBridge.exposeInMainWorld('alert', (msg) => {
    console.log('custom alert called:', msg);
  });
  console.log('Successfully exposed over window.alert');
} catch (e) {
  console.error('Failed to expose over window.alert:', e.message);
}
