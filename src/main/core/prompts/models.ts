import { IpcMainEvent } from 'electron';
import type { IWinDesConTab } from '~/types';

export class PromptBase {
  public modalId: number | null = null;

  constructor(
    private readonly tabData: IWinDesConTab,
    protected readonly event: IpcMainEvent,
    private readonly type: 'alert' | 'confirm' | 'prompt',
  ) {}

  show() {
    const modal = this.tabData.window.modal.open(`prompt-${this.type}`, {
      query: this.query(),
    });
    this.modalId = modal.wcId;
  }

  hide() {
    if (this.modalId) {
      this.tabData.window.modal.close();
      this.modalId = null;
    }
  }

  protected query(): Record<string, string> {
    return {};
  }

  setReturnValue(response: unknown) {
    this.event.returnValue = response;
  }
}

export class AlertPrompt extends PromptBase {
  constructor(
    tabData: IWinDesConTab,
    event: IpcMainEvent,
    private readonly message: string,
  ) {
    super(tabData, event, 'alert');
  }

  protected query(): Record<string, string> {
    return {
      message: this.message,
      url: this.event.sender.getURL(),
    };
  }
}

export class ConfirmPrompt extends PromptBase {
  constructor(tabData: IWinDesConTab, event: IpcMainEvent) {
    super(tabData, event, 'confirm');
  }
}

export class PromptPrompt extends PromptBase {
  constructor(tabData: IWinDesConTab, event: IpcMainEvent) {
    super(tabData, event, 'prompt');
  }
}
