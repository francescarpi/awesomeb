import log, { LogFunctions } from 'electron-log';

export function buildScopeLog(scope: string, enabled?: boolean): LogFunctions {
  if (enabled === false) {
    return {
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {},
      silly: () => {},
    } as LogFunctions;
  }
  return log.scope(scope);
}
