export const ALLOWED_PERMISSIONS: string[] = [
  // Storage
  'storage-access',

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
