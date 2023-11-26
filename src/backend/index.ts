import fs from 'fs';
import { execSync } from 'child_process';
import { buildIndex } from './build/index';

export default function buildBackend(aditionalDependencies: string[], jsonObj: any = {})
{
    fs.mkdir('./backend', (err) => {
        if (err) {
          console.error(`Error creating directory: ${err.message}`);
        } else {
          console.log(`Directory ./backend created successfully.`);
        }
    });
    process.chdir('backend');
    const output = execSync('npm init -y', { encoding: 'utf-8' });
    console.log(output);
    buildIndex(aditionalDependencies, jsonObj.backend);
}