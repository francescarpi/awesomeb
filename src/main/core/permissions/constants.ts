export const ALLOWED_PERMISSIONS: string[] = [
  // Pasive sensors
  'sensors',
  'accelerometer',
  'gyroscope',
  'magnetometer',
  'ambient-light-sensor',

  // Clipboard
  'clipboard-sanitized-write',
  'clipboard-read',

  // UI / Media
  'fullscreen',
  'autoplay',

  // Standard web APIs
  'background-sync',
  'background-fetch',
];
