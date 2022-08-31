import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { S3Client } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler'
import { IConfig } from 'config';
import { listAllModelNFS } from '../models/list/listFromNFS';
import { listAllModelS3 } from '../models/list/listFromS3';
import { SERVICES } from '../../common/constants';
import { postFromS3ToS3 } from './post/postFromS3ToS3';
import { getDataS3 } from './get/getFromS3';
import { getDataNFS } from './get/getFromNFS';
import { postFromNFSToS3 } from './post/postFromNFSToS3';
import { deleteKeyFromS3 } from './delete/deleteFromS3';


@injectable()
export class ListFilesManager {
  private readonly s3Client: S3Client = new S3Client({
    endpoint: this.config.get<string>('s3.endPoint'),
    forcePathStyle: this.config.get('s3.forcePathStyle'),
    credentials: {
      accessKeyId: this.config.get<string>('s3.awsAccessKeyId'),
      secretAccessKey: this.config.get('s3.awsSecretAccessKey'),
    },
    requestHandler: new NodeHttpHandler({connectionTimeout: 3000}),
    // maxAttempts: 3,
  });
  private readonly time = Date.now();
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger, @inject(SERVICES.CONFIG) private readonly config: IConfig) {}

  public async postFromS3ToS3Manager(path: string): Promise<string> {
    this.logger.info({
      msg: 'getting files from S3 and writting files to target Bucket',
      model: path,
      bucket: this.config.get<string>('s3.bucket'),
      destinationBucket: this.config.get<string>('s3.destinationBucket'),
    });
    // The files array.
    let files: string[] = [];
    try {
      this.logger.info({
        msg: 'Listing the model in the bucket',
        model: path,
        bucket: this.config.get<string>('s3.bucket'),
      });

      if (this.config.get<string>('source') == "S3") {
        files = await listAllModelS3(this.s3Client, path);
      } else if (this.config.get<string>('source') == "NFS") {
        files = listAllModelNFS(path);
      } else {
        throw new Error("Bad source!!!");
      }
      this.logger.info({
        msg: 'Successfully listed the files',
        path: path,
        bucket: this.config.get<string>('s3.bucket'),
        numOfFiles: files.length,
      });

      const numOfFiles = files.length;
      let currentFiles = 0;
      const buffer = Number(this.config.get<string>('buffer'));
      let index = 0;

      this.logger.info({
        msg: 'Starting write the files to S3',
        model: path,
        bucket: this.config.get<string>('s3.destinationBucket'),
        numOfFiles: files.length,
        buffer: buffer
      });
      
      while (files.length - index >= buffer) {
        // Iterates over the files
        await Promise.all(files.slice(index, index + buffer).map(async key => {
  
          if (this.config.get<string>('source') == "S3") {
            // Gets the object from S3 by its key.
            const data = await getDataS3(this.s3Client, key);
  
            // Put the key with its data to S3.
            await postFromS3ToS3(this.s3Client, key, data);
  
          } else {
            // Gets the object from NFS by its key.
            const data = await getDataNFS(key);
  
            // Put the key with its data to S3.
            await postFromNFSToS3(this.s3Client, key, data);
          }
          
          // After putting the file, increase the counter.
          currentFiles++;
        }));
        index = index + buffer;
      }

      await Promise.all(files.slice(index).map(async key => {
  
        if (this.config.get<string>('source') == "S3") {
          // Gets the object from S3 by its key.
          const data = await getDataS3(this.s3Client, key);

          // Put the key with its data to S3.
          await postFromS3ToS3(this.s3Client, key, data);
          this.logger.info({ msg: 'Wrote to S3', key, destinationBucket: this.config.get<string>('s3.destinationBucket') });


        } else {
          // Gets the object from NFS by its key.
          const data = await getDataNFS(key);

          // Put the key with its data to S3.
          await postFromNFSToS3(this.s3Client, key, data);
        }
        
        // After putting the file, increase the counter.
        currentFiles++;
      }));

      if (currentFiles == numOfFiles) {
        this.logger.info({ msg: 'Wrote files to S3 in the bucket', destinationBucket: this.config.get<string>('s3.destinationBucket') });
      } else {
        this.logger.info({ msg: 'Didn\'t wrote files to S3 in the bucket', numOfSuccess: currentFiles, destinationBucket: this.config.get<string>('s3.destinationBucket') });
      }
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      console.log((Date.now() - this.time) / 1000);
      return "The flow completed successfully!";
    } catch (e) {
      this.logger.error({ msg: 'Failed to write the files from S3', e });
      await Promise.all(files.map(async file => {
        this.logger.info({ msg: 'Delete file to S3', file, destinationBucket: this.config.get<string>('s3.destinationBucket')});
        await deleteKeyFromS3(this.s3Client, file);
      }));
      this.logger.info({ msg: 'Deleted files successfully from the bucket', destinationBucket: this.config.get<string>('s3.bucket') });
      throw e;
    }
  }
}
