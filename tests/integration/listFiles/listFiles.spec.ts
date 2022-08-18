import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import config from 'config';

import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { ListFilesRequestSender } from './helpers/requestSender';

describe('listFiles', function () {
  let requestSender: ListFilesRequestSender;
  beforeEach(function () {
    const app = getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
        { token: SERVICES.CONFIG, provider: { useValue: config } },
      ],
      useChild: true,
    });
    requestSender = new ListFilesRequestSender(app);
  });

  describe('GET /listfiles/NFS/{path}', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and the array files', async function () {
        const path = 'NewYork';
        const response = await requestSender.getFromNFSManager(path);

        expect(response.status).toBe(httpStatusCodes.OK);

        const files: string[] = response.body as string[];
        expect(response).toSatisfyApiSpec();
        expect(files.length).toBeGreaterThan(0);
      });
    });
    describe('Bad Path', function () {
      it('should return 400 status code when model is not found', async function () {
        const path = 'avi';

        const response = await requestSender.getFromNFSManager(path);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', `${path} is not exists in folder ${config.get<string>('3dir')}`);
      });
    });
    describe('Sad Path', function () {
      // All requests with status code 4XX-5XX
    });
  });

  describe('GET /listfiles/S3/{path}', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and the array files', async function () {
        const path = 'NewYork';

        const response = await requestSender.getFromS3Manager(path);

        expect(response.status).toBe(httpStatusCodes.OK);
        const files: string[] = response.body as string[];
        expect(response).toSatisfyApiSpec();
        expect(files.length).toBeGreaterThan(0);
      });
    });
    describe('Bad Path', function () {
      it('should return 400 status code when model is not found', async function () {
        const path = 'avi';

        const response = await requestSender.getFromS3Manager(path);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', `Model ${path} is not exists in folder ${config.get<string>('3dir')}`);
      });
    });
    describe('Sad Path', function () {
      it('should return 403 status code when model is not found', async function () {
        const path = 'avi';

        const response = await requestSender.getFromS3Manager(path);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', `Model ${path} is not exists in folder ${config.get<string>('3dir')}`);
      });
    });
  });
});
