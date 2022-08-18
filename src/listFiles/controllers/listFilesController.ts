import { HttpError } from '@map-colonies/error-express-handler';
import { Logger } from '@map-colonies/js-logger';
import { Meter } from '@map-colonies/telemetry';
import { BoundCounter } from '@opentelemetry/api-metrics';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { SERVICES } from '../../common/constants';
import { PathNotExists } from '../../common/errors';
import { PathParams } from '../../common/interfaces';

import { ListFilesManager } from '../models/listFilesManager';

type GetResourceHandler = RequestHandler<PathParams, string[]>;
type CreateRequestHandler = RequestHandler<PathParams, void>;

@injectable()
export class ListFilesController {
  private readonly createdResourceCounter: BoundCounter;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(ListFilesManager) private readonly manager: ListFilesManager,
    @inject(SERVICES.METER) private readonly meter: Meter
  ) {
    this.createdResourceCounter = meter.createCounter('created_resource');
  }

  public getFromNFS: GetResourceHandler = (req, res, next) => {
    try {
      const { modelPath } = req.params;
      return res.status(httpStatus.OK).json(this.manager.getFromNFSManager(modelPath));
    } catch (error) {
      if (error instanceof PathNotExists) {
        (error as HttpError).status = httpStatus.BAD_REQUEST;
      }
      return next(error);
    }
  };

  public getFromS3: GetResourceHandler = async (req, res, next) => {
    try {
      const { modelPath } = req.params;
      return res.status(httpStatus.OK).json(await this.manager.getFromS3Manager(modelPath));
    } catch (error) {
      if (error instanceof PathNotExists) {
        (error as HttpError).status = httpStatus.BAD_REQUEST;
      }
      return next(error);
    }
  };

  public postFromS3ToS3: CreateRequestHandler = async (req, res, next) => {
    try {
      const { modelPath } = req.params;
      return res.status(httpStatus.OK).json(await this.manager.postFromS3ToS3Manager(modelPath));
    } catch (error) {
      if (error instanceof PathNotExists) {
        (error as HttpError).status = httpStatus.BAD_REQUEST;
      }
      return next(error);
    }
  };
}
