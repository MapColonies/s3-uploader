import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { ListFilesController } from '../controllers/listFilesController';

const listFilesRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(ListFilesController);

  router.get('/NFS/:modelPath', controller.getFromNFS);
  router.get('/S3/:modelPath', controller.getFromS3);
  router.post('/S3/:modelPath', controller.postFromS3ToS3);

  return router;
};

export const LIST_FILES_ROUTER_SYMBOL = Symbol('listFilesRouterFactory');

export { listFilesRouterFactory };
