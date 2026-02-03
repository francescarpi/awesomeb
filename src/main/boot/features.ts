import { app } from 'electron';

export function setupFeatures() {
  app.commandLine.appendSwitch('disable-features', 'WebAuthentication,WebAuth');

  // app.commandLine.appendSwitch('enable-logging')
  // app.commandLine.appendSwitch('v', '1')

  app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
}
