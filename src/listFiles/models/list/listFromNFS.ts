import * as fs from 'fs';
import * as config from 'config';
import { PathNotExists } from '../../../common/errors';

function list1LevelNFS(path: string): string[] {
  const arrayOfList: string[] = [];
  const rootDir: string = config.get('3dir');
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

export { list1LevelNFS };
