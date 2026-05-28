import { ZodSchema } from 'zod';
import { dialog } from 'electron';
import log from 'electron-log';

const scopeLog = log.scope('Validation');

export function validateStore<T>(
  schema: ZodSchema<T>,
  data: unknown,
  storeName: string,
  defaults: T,
): T {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  const errors = result.error.issues.map((e) => `  • ${e.path.join('.')}: ${e.message}`).join('\n');

  const message = `The "${storeName}" data file is corrupted and could not be loaded.\n\nErrors:\n${errors}\n\nDefault settings will be used.`;

  scopeLog.error(`Validation error in ${storeName}:`, result.error);
  dialog.showErrorBox(`${storeName} - Validation Error`, message);

  return defaults;
}
