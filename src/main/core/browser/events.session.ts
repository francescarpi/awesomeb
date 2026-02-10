import { Browser } from '@/core';
import { TPartitionId } from '~/types';
import { session, desktopCapturer } from 'electron';

export function registerSessionEvents(_browser: Browser, partitionId: TPartitionId) {
  const ses = session.fromPartition(partitionId);

  // ----------------------------------------------------------------------------------------------- //
  ses.setDisplayMediaRequestHandler(
    async (_request, callback) => {
      desktopCapturer.getSources({ types: ['window', 'screen'] }).then((sources) => {
        callback({ video: sources[0], audio: 'loopback' });
      });
    },
    { useSystemPicker: true },
  );
}
