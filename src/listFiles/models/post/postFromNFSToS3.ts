import { Readable } from 'stream';
import config from 'config';
import { PutObjectCommand, PutObjectRequest, S3Client } from '@aws-sdk/client-s3';

async function postFromNFSToS3 (s3Client: S3Client, key: string, data: Readable): Promise<void> {

    /* eslint-disable @typescript-eslint/naming-convention */
    const putParams: PutObjectRequest = {
      Bucket: config.get('s3.destinationBucket'),
      Key: key,
      Body: data,
      ContentLength: data.readableLength,
    };
    /* eslint-enable @typescript-eslint/naming-convention */
    console.log(await s3Client.send(new PutObjectCommand(putParams)));
  }

export { postFromNFSToS3 };
