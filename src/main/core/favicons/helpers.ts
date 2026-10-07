import { net } from 'electron';

export async function fetchFaviconUsingNet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = net.request(url);
    const chunks: Buffer[] = [];

    request.on('response', (response) => {
      const contentType = (response.headers['content-type'] as string) || 'image/png';

      if (['text/html'].includes(contentType)) {
        reject();
      }

      response.on('data', (chunk) => {
        chunks.push(chunk);
      });

      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString('base64');
        resolve(`data:${contentType};base64,${base64}`);
      });

      response.on('error', reject);
    });

    request.on('error', reject);
    request.end();
  });
}
