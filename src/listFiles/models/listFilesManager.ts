import * as fs from 'fs';
import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import {
  ListObjectsCommand,
  ListObjectsRequest,
  S3Client,
  GetObjectCommand,
  GetObjectRequest,
  PutObjectCommand,
  PutObjectRequest,
} from '@aws-sdk/client-s3';
import { SERVICES } from '../../common/constants';
import { PathNotExists } from '../../common/errors';
import { IConfig } from '../../common/interfaces';

@injectable()
export class ListFilesManager {
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger, @inject(SERVICES.CONFIG) private readonly config: IConfig) {}

  public getFromNFSManager(path: string): string[] {
    this.logger.info({ msg: 'getting files from NFS', path: path });
    try {
      const result = this.get1LevelNFS(path);
      this.logger.info({ msg: 'Got files from NFS', path: path });
      return result;
    } catch (e) {
      this.logger.error({ msg: 'Failed to get files from NFS', path: path });
      throw e;
    }
  }

  public async getFromS3Manager(path: string): Promise<string[]> {
    this.logger.info({ msg: 'getting files from S3', path: path });
    try {
      const result = await this.get1LevelS3(path);
      this.logger.info({ msg: 'Got files from S3', path: path });
      return result;
    } catch (e) {
      this.logger.error({ msg: 'Failed to get files from S3', path: path });
      throw e;
    }
  }

  public async postFromS3ToS3Manager(key: string): Promise<void> {
    this.logger.info({ msg: 'getting files from S3', key: key });
    try {
      this.logger.info({ msg: 'Got files from S3, starting writting to destination bucket', key: key });
      return await this.postFromS3ToS3(key);
    } catch (e) {
      this.logger.error({ msg: 'Failed to get files from S3', key: key });
      throw e;
    }
  }

  private get1LevelNFS(path: string): string[] {
    const arrayOfList: string[] = [];
    const rootDir: string = this.config.get('3dir');
    if (!fs.existsSync(`${rootDir}/${path}`)) {
      throw new PathNotExists(`${path} is not exists in folder ${rootDir}`);
    }
    fs.readdirSync(`${rootDir}/${path}`).forEach((file) => {
      if (fs.lstatSync(`${rootDir}/${path}/${file}`).isDirectory()) {
        arrayOfList.push(`${path}/${file}/`);
      } else {
        arrayOfList.push(`${path}/${file}`);
      }
    });

    return arrayOfList;
  }

  private async get1LevelS3(path: string): Promise<string[]> {
    const pathWithSlash = path + '/';

    const s3Client: S3Client = new S3Client({
      endpoint: this.config.get<string>('s3.endPoint'),
      forcePathStyle: this.config.get('s3.forcePathStyle'),
      credentials: {
        accessKeyId: this.config.get<string>('s3.awsAccessKeyId'),
        secretAccessKey: this.config.get('s3.awsSecretAccessKey'),
      },
    });

    /* eslint-disable @typescript-eslint/naming-convention */
    const params: ListObjectsRequest = {
      Bucket: this.config.get('s3.bucket'),
      Delimiter: '/',
      Prefix: pathWithSlash,
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    const arrayOfList: string[] = await this.listOneLevelS3(s3Client, params, pathWithSlash, []);

    if (arrayOfList.length == 0) {
      throw new PathNotExists(`Model ${path} doesn't exists in bucket ${this.config.get<string>('s3.bucket')}!`);
    }
    return arrayOfList;
  }

  private async listOneLevelS3(s3Client: S3Client, params: ListObjectsRequest, path: string, arrayOfList: string[]): Promise<string[]> {
    const data = await s3Client.send(new ListObjectsCommand(params));
    if (data.Contents) {
      arrayOfList = arrayOfList.concat(data.Contents.map((item) => (item.Key != undefined ? item.Key : '')));
    }

    if (data.CommonPrefixes) {
      arrayOfList = arrayOfList.concat(data.CommonPrefixes.map((item) => (item.Prefix != undefined ? item.Prefix : '')));
    }

    if (data.IsTruncated == true) {
      params.Marker = data.NextMarker;
      await this.listOneLevelS3(s3Client, params, path, arrayOfList);
    }
    return arrayOfList;
  }

  private async postFromS3ToS3(key: string): Promise<void> {
    const s3Client: S3Client = new S3Client({
      endpoint: this.config.get<string>('s3.endPoint'),
      forcePathStyle: this.config.get('s3.forcePathStyle'),
      credentials: {
        accessKeyId: this.config.get<string>('s3.awsAccessKeyId'),
        secretAccessKey: this.config.get('s3.awsSecretAccessKey'),
      },
    });

    /* eslint-disable @typescript-eslint/naming-convention */
    const getParams: GetObjectRequest = {
      Bucket: this.config.get('s3.bucket'),
      Key: key,
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    const data = await s3Client.send(new GetObjectCommand(getParams));

    /* eslint-disable @typescript-eslint/naming-convention */
    const putParams: PutObjectRequest = {
      Bucket: this.config.get('s3.destinationBucket'),
      Key: key,
      Body: data.Body,
      ContentLength: data.ContentLength,
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    await s3Client.send(new PutObjectCommand(putParams));
  }
}
