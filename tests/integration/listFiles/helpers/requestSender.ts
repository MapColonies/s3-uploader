import * as supertest from 'supertest';

export class ListFilesRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async getFromNFSManager(path: string): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/listFiles/NFS/${path}`).set('Content-Type', 'application/json');
  }

  public async getFromS3Manager(path: string): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/listFiles/S3/${path}`).set('Content-Type', 'application/json');
  }
}
