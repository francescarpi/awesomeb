import { app } from 'electron';

export function setupFeatures() {
  app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
}
