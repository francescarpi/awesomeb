import { Window } from '@/core';
import { PromptBase } from './models';

export class PromptsManager {
  private readonly queue: PromptBase[] = [];
  private currentPrompt: PromptBase | null = null;

  constructor(public readonly window: Window) {}

  enqueue(prompt: PromptBase) {
    this.queue.push(prompt);
    this.processQueue();
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      return;
    }
    this.currentPrompt = this.queue[0];
    this.currentPrompt.show();
  }

  get current(): PromptBase | null {
    return this.currentPrompt;
  }

  next() {
    if (this.currentPrompt) {
      this.currentPrompt.hide();
      this.queue.shift();
      this.currentPrompt = null;
      this.processQueue();
    }
  }
}
