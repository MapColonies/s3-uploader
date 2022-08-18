import jsLogger from '@map-colonies/js-logger';
import { ListFilesManager } from '../../../../src/listFiles/models/listFilesManager';

let listFilesManager: ListFilesManager;

describe('ListFilesManager', () => {
  beforeEach(function () {
    listFilesManager = new ListFilesManager(jsLogger({ enabled: false }));
  });
  describe('#getResource', () => {
    it('return the resource of id 1', function () {
      // action
      const resource = listFilesManager.getResource();

      // expectation
      expect(resource.id).toBe(1);
      expect(resource.name).toBe('ronin');
      expect(resource.description).toBe('can you do a logistics run?');
    });
  });
  describe('#createResource', () => {
    it('return the resource of id 1', function () {
      // action
      const resource = listFilesManager.createResource({ description: 'meow', name: 'cat' });

      // expectation
      expect(resource.id).toBeLessThanOrEqual(100);
      expect(resource.id).toBeGreaterThanOrEqual(0);
      expect(resource).toHaveProperty('name', 'cat');
      expect(resource).toHaveProperty('description', 'meow');
    });
  });
});
