import { MidConfig } from "./index";
import { createDirIfNotExistent, setupNode, arrayToString } from "./helper";
import fs from 'fs';

export function buildApp(config: MidConfig)
{
    const appPath = config.paths?.server ?? './app';
    setupNode([
        "typescript",
        "express"
    ], appPath);
    process.chdir(appPath);
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
    fs.writeFileSync('tsconfig.json', arrayToString([
        
    ]));
    createDirIfNotExistent('./src');
    process.chdir('./src')
}