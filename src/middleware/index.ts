import fs from 'fs';
import { pathExists, execute, installDependencies } from '../helper';
import { buildFunc } from './build/func';
import { buildStore } from './build/store';

export default function buildMiddleware(obj: any, lang: string)
{
    if (!pathExists('./frontend'))
    {
      fs.mkdir('./frontend', (err) => {
        if (err) {
        console.error(`Error creating directory: ${err.message}`);
        }
      });
    } 
    process.chdir('./frontend');
    if (!pathExists('package.json'))
    {
      const output = execute('npm init -y');
      console.log(output);
    }
    const installedDep = installDependencies(obj.dependencies, ['react', 'react-dom'], ['react-router-dom', 'axios']);
    if (!pathExists('./middleware'))
    {
        fs.mkdir('./middleware', (err) => {
            if (err) {
            console.error(`Error creating directory: ${err.message}`);
            }
        });
    }
    if (!pathExists('./middleware/store'))
    {
        fs.mkdir('./middleware/store', (err) => {
            if (err) {
            console.error(`Error creating directory: ${err.message}`);
            }
        });
    }
    if (!pathExists('./middleware/func'))
    {
        fs.mkdir('./middleware/func', (err) => {
            if (err) {
            console.error(`Error creating directory: ${err.message}`);
            }
        });
    }
    buildFunc(obj, installedDep, lang);
    buildStore(obj, installedDep, lang);
    process.chdir('..');
}