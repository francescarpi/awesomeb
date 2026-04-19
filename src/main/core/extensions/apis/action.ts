import { Browser } from '@/core'
import { TPartitionId } from '~/types'

import log from 'electron-log'
const scopeLog = log.scope('ChromeAction')

export class ChromeAction {
  constructor(private readonly browser: Browser) {}

  setIcon(partitionId: TPartitionId, extensionId: string, details: chrome.action.TabIconDetails): void {
    const ext = this.browser.extensions.getExtensionByPartition(partitionId, extensionId)
    if (!ext) {
      scopeLog.warn(`Extension with id ${extensionId} not found`)
      return
    }
    ext.setIcon(details)
  }
}
