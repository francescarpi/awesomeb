import { TWindowId } from '@shared/types';

export {};

declare global {
  const awesome: {
    closeModal: (winId: TWindowId) => void;
  };
}
