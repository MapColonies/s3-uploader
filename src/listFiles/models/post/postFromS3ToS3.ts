import * as config from 'config';
import { GetObjectCommandOutput, PutObjectCommand, PutObjectRequest, S3Client } from '@aws-sdk/client-s3';

async function postFromS3ToS3(key: string, data: GetObjectCommandOutput): Promise<void> {
  const s3Client: S3Client = new S3Client({
    endpoint: config.get<string>('s3.endPoint'),
    forcePathStyle: config.get('s3.forcePathStyle'),
    credentials: {
      accessKeyId: config.get<string>('s3.awsAccessKeyId'),
      secretAccessKey: config.get('s3.awsSecretAccessKey'),
    },
  });

  /* eslint-disable @typescript-eslint/naming-convention */
  const putParams: PutObjectRequest = {
    Bucket: config.get('s3.destinationBucket'),
    Key: key,
    Body: data.Body,
    ContentLength: data.ContentLength,
  };
  /* eslint-enable @typescript-eslint/naming-convention */

  await s3Client.send(new PutObjectCommand(putParams));
}

export { postFromS3ToS3 };
