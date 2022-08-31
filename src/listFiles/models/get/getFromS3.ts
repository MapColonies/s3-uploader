import config from 'config';
import { GetObjectCommand, GetObjectCommandOutput, GetObjectRequest, S3Client } from '@aws-sdk/client-s3';

async function getDataS3(s3Client: S3Client, key: string): Promise<GetObjectCommandOutput> {
  /* eslint-disable @typescript-eslint/naming-convention */
  const getParams: GetObjectRequest = {
    Bucket: config.get('s3.bucket'),
    Key: key,
  };
  /* eslint-enable @typescript-eslint/naming-convention */

  const data = await s3Client.send(new GetObjectCommand(getParams));
  // console.log(data);
  return data;
}

export { getDataS3 };
