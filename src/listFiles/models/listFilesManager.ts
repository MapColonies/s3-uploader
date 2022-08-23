import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { ListObjectsCommand, ListObjectsRequest, S3Client } from '@aws-sdk/client-s3';
import { IConfig } from 'config';
import { list1LevelNFS } from '../models/list/listFromNFS';
import { list1LevelS3, listAllModelS3 } from '../models/list/listFromS3';
import { SERVICES } from '../../common/constants';
import { postFromS3ToS3 } from './post/postFromS3ToS3';
import { getDataS3 } from './get/getFromS3';

@injectable()
export class ListFilesManager {
  private readonly s3Client: S3Client = new S3Client({
    endpoint: this.config.get<string>('s3.endPoint'),
    forcePathStyle: this.config.get('s3.forcePathStyle'),
    credentials: {
      accessKeyId: this.config.get<string>('s3.awsAccessKeyId'),
      secretAccessKey: this.config.get('s3.awsSecretAccessKey'),
    },
  });
  
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger, @inject(SERVICES.CONFIG) private readonly config: IConfig) {}

  // public getFromNFSManager(path: string): string[] {
  //   this.logger.info({ msg: 'getting files from NFS', path: path });
  //   try {
  //     const result = list1LevelNFS(path);
  //     this.logger.info({ msg: 'Got files from NFS', path: path });
  //     return result;
  //   } catch (e) {
  //     this.logger.error({ msg: 'Failed to get files from NFS', path: path });
  //     throw e;
  //   }
  // }

  // public async getFromS3Manager(path: string): Promise<string[]> {
  //   this.logger.info({ msg: 'getting files from S3', path: path });
  //   try {
  //     const result = await list1LevelS3(path);
  //     this.logger.info({ msg: 'Got files from S3', path: path });
  //     return result;
  //   } catch (e) {
  //     this.logger.error({ msg: 'Failed to get files from S3', path: path });
  //     throw e;
  //   }
  // }

  // public async postFromS3ToS3Manager(path: string): Promise<void> {
  //   this.logger.info({ msg: 'getting files from S3', path: path });
  //   try {
  //     const files: string[] = [path];
  //     while (files.length > 0) {
  //       list1LevelS3(path)
  //     }
  //     this.logger.info({ msg: 'Got files from S3, starting writting to destination bucket', key: key });
  //     return await postFromS3ToS3(key);
  //   } catch (e) {
  //     this.logger.error({ msg: 'Failed to get files from S3', key: key });
  //     throw e;
  //   }
  // }

  public async postFromS3ToS3Manager(path: string): Promise<void> {
    this.logger.info({
      msg: 'getting files from S3 and writting files to target Bucket',
      path: path,
      bucket: this.config.get<string>('s3.bucket'),
      destinationBucket: this.config.get<string>('s3.destinationBucket'),
    });
    try {
      let currentFiles = 0;
      this.logger.info({
        msg: 'Listing the model in the bucket',
        path: path,
        bucket: this.config.get<string>('s3.bucket'),
      });
      // The files array.
      const files: string[] = await listAllModelS3(this.s3Client, path);

      this.logger.info({
        msg: 'Successfully listed the files, starting write',
        path: path,
        bucket: this.config.get<string>('s3.bucket'),
        numOfFiles: files.length,
      });

      // Runs until all files were putted successfuly.
      while (currentFiles < files.length) {
        // Iterates over the files
        files.map(async (key) => {
          // Gets the object from S3 by its key.
          const data = await getDataS3(this.s3Client, key);
          // Put the key with its data to S3.
          await postFromS3ToS3(key, data);
          // After putting the file, increase the counter.
          currentFiles++;
        });
      }
      this.logger.info({ msg: 'Wrote files to S3 in the bucket', destinationBucket: this.config.get<string>('s3.destinationBucket') });
    } catch (e) {
      this.logger.error({ msg: 'Failed to write the files from S3', e });
      throw e;
    }
  }
}
