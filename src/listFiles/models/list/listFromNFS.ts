import * as fs from 'fs';
import config from 'config';
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

function listAllModelNFS(modelName: string): string[] {
  const listOfFiles: string[] = [];
  const rootDir: string = config.get('3dir');
  if (!fs.existsSync(`${rootDir}/${modelName}`)) {
    throw new PathNotExists(`${modelName} is not exists in folder ${rootDir}`);
  }

  const folders: string[] = [modelName];

  while (folders.length > 0) {
    console.log("Listing folder: " + folders[0]);
    fs.readdirSync(`${rootDir}/${folders[0]}`).forEach((file) => {
      if (fs.lstatSync(`${rootDir}/${folders[0]}/${file}`).isDirectory()) {
        folders.push(`${folders[0]}/${file}`);
      } else {
        listOfFiles.push(`${folders[0]}/${file}`);
      }
    });
    folders.shift();
  }
  return listOfFiles;
}


export { list1LevelNFS, listAllModelNFS };
