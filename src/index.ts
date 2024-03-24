import { Request, Response, NextFunction } from 'express';
import { execSync } from 'child_process';
import fs from 'fs';
import * as url from "url";
import { createDirIfNotExistent, arrayToString, setupNode } from './helper';
import { buildApp } from './app';
import { buildServer } from './server';

export type Req = Request;
export type Res = Response;
export type NextFunc = NextFunction;
export type MidFunc = (req: Req, res: Res, next: NextFunc) => any;
export type Func = (req: Req, res: Res) => any;
export type TypeString = 'string' | 'number' | 'boolean' | 'object' | 'array';
export type ReqConfig = {
    body?: {
        [key: string]: TypeString | { type: TypeString, required: boolean };
    };
    params?: {
        urlEncoded?: boolean; 
        [key: string]: TypeString | { type: TypeString, required: boolean } | boolean | undefined;
    };
};
export type ResConfig = {};
export type Service = {
    req?: ReqConfig;
    res?: ResConfig;
    [key: string]: Func | ReqConfig | ResConfig | undefined;
};
export type Controller = {
    get?: Service;
    post?: Service;
    put?: Service;
    delete?: Service;
    patch?: Service;
    options?: Service;
    head?: Service;
    connect?: Service;
    trace?: Service;
    type?: TypeString; // dynamic route type
};
export type MidConfig = {
    language?: string;
    port: number;
    host?: string;
    ssl?: boolean;
    cors?: boolean;
    paths?: {
        app?: string;
        server?: string;
    }
    routes?: {
        [key: string]: Controller | {
            [key: string]: Controller | {
                [key: string]: Controller | {
                    [key: string]: Controller;
                };
            };
        };
    }
    middlewares?: Service;
}

export function init()
{
    setupNode([
        "nodemon", 
        "@types/middlifier"
    ], './gen');
    process.chdir('./gen');
    fs.writeFileSync('mid.config.ts', arrayToString([
        'import { MidConfig } from "middlifier";',
        '',
        'export const config: MidConfig = {',
        '',
        '}',
    ]));
    fs.writeFileSync('index.ts', arrayToString([
        'import { start } from "middlifier";',
        'import { config } from "./mid.config";',
        '',
        'start(config);',
    ]));
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
    // tsconfig.json
    execSync("npx tsc --init");
    let tsconfigContent = fs.readFileSync('tsconfig.json', { encoding: 'utf-8', flag: 'r' });
    tsconfigContent = tsconfigContent.replace('// "outDir": "./"', '"outdir": "./dist');
    fs.writeFileSync('tsconfig.json', tsconfigContent);
    // ---------------------------------------
    // package.json
    let packageJsonContent = fs.readFileSync('package.json', { encoding: 'utf-8', flag: 'r' });
    let packageJson = JSON.parse(packageJsonContent);
    if (!packageJson.scripts) packageJson.scripts = {};
    if (!packageJson.scripts.build) packageJson.scripts.build = "npx tsc";
    if (!packageJson.scripts.dev) packageJson.scripts.dev = "nodemon src/index.ts"
    if (!packageJson.scripts.start) packageJson.scripts.start = "node dist/index.js";
    packageJsonContent = JSON.stringify(packageJsonContent);
    fs.writeFileSync('package.json', packageJsonContent);
    // ---------------------------------------
    process.chdir('..');
}

export function start(config: MidConfig)
{
    setupNode([], config.paths?.server ?? 'server');
    setupNode([], config.paths?.app ?? 'app');
    const serverPath = createDirIfNotExistent(`./${config.paths?.server ?? 'server'}`);
    const appPath = createDirIfNotExistent(`./${config.paths?.app ?? 'app'}`);
    buildServer(config);
    buildApp(config);
}

if (import.meta.url.startsWith('file:')) 
{ 
    const modulePath = url.fileURLToPath(import.meta.url);
    if (process.argv[1] === modulePath) 
    { 
        init();
    }
}