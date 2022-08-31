
import * as fs from 'fs/promises';
import { Readable } from 'stream';
import config from 'config';

async function getDataNFS(file: string): Promise<Readable> {
    const rootDir: string = config.get('3dir');
    return Readable.from(await fs.readFile(`${rootDir}/${file}`));
}

export { getDataNFS };
