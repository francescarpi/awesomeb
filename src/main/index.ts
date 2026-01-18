import { app } from 'electron';
import { Window } from '@main/core';

function init() {
  const w1 = new Window({ id: 1 });
  const w2 = new Window({ id: 2 });
}

app.whenReady().then(init);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
