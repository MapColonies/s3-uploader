import { ListObjectsCommand, ListObjectsRequest, S3Client } from '@aws-sdk/client-s3';
import config from 'config';
import { PathNotExists } from '../../../common/errors';

async function list1LevelS3(s3Client: S3Client, path: string): Promise<string[]> {
  const pathWithSlash = path + '/';

  /* eslint-disable @typescript-eslint/naming-convention */
  const params: ListObjectsRequest = {
    Bucket: config.get('s3.bucket'),
    Delimiter: '/',
    Prefix: pathWithSlash,
  };
  /* eslint-enable @typescript-eslint/naming-convention */

  const filesList: string[] = await getOneLevelS3(s3Client, params, pathWithSlash, []);

  if (filesList.length == 0) {
    throw new PathNotExists(`Model ${path} doesn't exists in bucket ${config.get<string>('s3.bucket')}!`);
  }
  return filesList;
}

async function getOneLevelS3(s3Client: S3Client, params: ListObjectsRequest, path: string, arrayOfList: string[]): Promise<string[]> {
  const data = await s3Client.send(new ListObjectsCommand(params));
  if (data.Contents) {
    arrayOfList = arrayOfList.concat(data.Contents.map((item) => (item.Key != undefined ? item.Key : '')));
  }

  if (data.CommonPrefixes) {
    arrayOfList = arrayOfList.concat(data.CommonPrefixes.map((item) => (item.Prefix != undefined ? item.Prefix : '')));
  }

  if (data.IsTruncated == true) {
    params.Marker = data.NextMarker;
    await getOneLevelS3(s3Client, params, path, arrayOfList);
  }
  return arrayOfList;
}

async function listAllModelS3(s3Client: S3Client, path: string): Promise<string[]> {
  const pathWithSlash = path + '/';

  /* eslint-disable @typescript-eslint/naming-convention */
  const params: ListObjectsRequest = {
    Bucket: config.get('s3.bucket'),
    Delimiter: '/',
    Prefix: pathWithSlash,
  };
  /* eslint-enable @typescript-eslint/naming-convention */

  const filesList: string[] = [];

  const folders: string[] = [pathWithSlash];

  while (folders.length > 0) {
    console.log("Listing folder: " + folders[0]);
    (await getOneLevelS3(s3Client, params, folders[0], [])).map((item) => {
      if (item.endsWith('/')) {
        folders.push(item);
      } else {
        filesList.push(item);
      }
    });
    folders.shift();
  }

  if (filesList.length == 0) {
    throw new PathNotExists(`Model ${path} doesn't exists in bucket ${config.get<string>('s3.bucket')}!`);
  }
  return filesList;
}

export { list1LevelS3, listAllModelS3 };
