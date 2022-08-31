import config from 'config';
import { S3Client, DeleteObjectCommand, DeleteObjectRequest } from '@aws-sdk/client-s3';

async function deleteKeyFromS3(s3Client: S3Client, key: string): Promise<void> {

  /* eslint-disable @typescript-eslint/naming-convention */
  const putParams: DeleteObjectRequest = {
    Bucket: config.get('s3.destinationBucket'),
    Key: key,
  };
  /* eslint-enable @typescript-eslint/naming-convention */
  await s3Client.send(new DeleteObjectCommand(putParams));
}

export { deleteKeyFromS3 };
