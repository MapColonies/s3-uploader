import config from 'config';
import { GetObjectCommandOutput, PutObjectCommand, PutObjectRequest, S3Client } from '@aws-sdk/client-s3';
import { StatusCodes } from 'http-status-codes';

async function postFromS3ToS3 (s3Client: S3Client, key: string, data: GetObjectCommandOutput): Promise<void> {

  /* eslint-disable @typescript-eslint/naming-convention */
  const putParams: PutObjectRequest = {
    Bucket: config.get('s3.destinationBucket'),
    Key: key,
    Body: data.Body,
    ContentLength: data.ContentLength,
  };
  /* eslint-enable @typescript-eslint/naming-convention */
  const response = await s3Client.send(new PutObjectCommand(putParams));
  if (response.$metadata.httpStatusCode != StatusCodes.OK) {
    throw new Error("Didn't write");
  }
}

export { postFromS3ToS3 };
