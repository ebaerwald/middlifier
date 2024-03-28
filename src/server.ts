import { MidConfig } from "./index.js";
import fs from 'fs';
import { arrayToString, createDirIfNotExistent } from "./helper.js";
import { execSync } from 'child_process';

export function buildServer(config: MidConfig)
{
    const serverPath = config.paths?.server ?? './server';
    process.chdir(serverPath);
    let packageJsonContent = fs.readFileSync('package.json', { encoding: 'utf-8', flag: 'r' });
    let packageJson = JSON.parse(packageJsonContent);
    if (!packageJson.scripts) packageJson.scripts = {};
    if (!packageJson.scripts.build) packageJson.scripts.build = "npx tsc";
    if (!packageJson.scripts.dev) packageJson.scripts.dev = "nodemon src/index.ts"
    if (!packageJson.scripts.start) packageJson.scripts.start = "node dist/index.js";
    packageJsonContent = JSON.stringify(packageJsonContent);
    fs.writeFileSync('package.json', packageJsonContent);
    // ---------------------------------------
    // tsconfig.json
    execSync("npx tsc --init");
    let tsconfigContent = fs.readFileSync('tsconfig.json', { encoding: 'utf-8', flag: 'r' });
    tsconfigContent = tsconfigContent.replace('// "outDir": "./"', '"outdir": "./dist');
    fs.writeFileSync('tsconfig.json', tsconfigContent);
    // ---------------------------------------
    // nodemon.json
    fs.writeFileSync('nodemon.json', arrayToString([
        '{',
        '   "ext": "ts",',
        '   "ignore": [".git", "node_modules/**/node_modules", "src/**/*.spec.ts"],',
        '   "execMap": {',
        '       "ts": "node --require ts-node/register"',
        '   "},',
        '   "watch": ["src/"]',
        '}'
    ]));
    // ---------------------------------------
    createDirIfNotExistent('./src');
    process.chdir('./src');
}