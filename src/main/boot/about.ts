import { app } from 'electron';
import path from 'path';

export function setupAbout() {
  app.setAboutPanelOptions({
    applicationName: 'AwesomeB(rowser)',
    applicationVersion: `Version ${app.getVersion()}`,
    version: process.versions.chrome,
    credits: 'Developed by Francesc Arpi Roca <francesc.arpi@gmail.com>',
    authors: ['Francesc Arpi Roca <francesc.arpi@gmail.com>'],
    website: 'https://awesomebrowser.app',
    iconPath: path.join(__dirname, '..', 'renderer', 'assets', 'logo.png'),
  });
}
