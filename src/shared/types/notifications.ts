export type TNotificationSeverity = 'info' | 'warning' | 'error';

export interface INotification {
  id: string;
  message: string;
  severity: TNotificationSeverity;
}
