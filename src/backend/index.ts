import fs from 'fs';
import { execSync } from 'child_process';
import { buildIndex } from './build/index';
import { buildRouter } from './build/router';
import { buildController } from './build/controller';
import { buildDatabase } from './build/database';
import { installDependencies, pathExists, getObjValue } from '../helper';

export default async function buildBackend(obj: any, lang: string)
{
    if (!pathExists('./backend'))
    {
      await fs.mkdir('./backend', (err) => {
        if (err) {
          console.error(`Error creating directory: ${err.message}`);
        }
      });
    } 
    process.chdir('./backend');
    const output = execSync('npm init -y', { encoding: 'utf-8' });
    console.log(output);
    const dep = getObjValue(obj, 'dependencies');
    const installedDep = installDependencies(dep, ['express', 'cors'], ['helmet', 'morgan']);
    buildIndex(obj, installedDep, lang);
    buildRouter(obj, installedDep, lang);
    buildController(obj, installedDep, lang);
    buildDatabase(obj, installedDep, lang);
    process.chdir('..');
}