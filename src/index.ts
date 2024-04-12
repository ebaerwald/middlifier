import { Request, Response, NextFunction } from 'express';
import { execSync } from 'child_process';
import fs from 'fs';
import * as url from "url";
import { createDirIfNotExistent, arrayToString, setupNode, navigateTo } from './helper.js';
import { buildApp } from './app.js';
import { buildServer } from './server.js';
import type { Config } from 'drizzle-kit';

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
export type DockerCommands = 'FROM' | 'RUN' | 'CMD' | 'LABEL' | 'EXPOSE' | 'ENV' | 'ADD' | 'COPY' | 'ENTRYPOINT' | 'VOLUME' | 'USER' | 'WORKDIR' | 'ARG' | 'ONBUILD' | 'STOPSIGNAL' | 'HEALTHCHECK' | 'SHELL';
export type DockerConfig = [
    DockerCommands,
    string
][];
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
    drizzle?: Config;
    docker?: DockerConfig;
}

export function init()
{
    setupNode([
        "nodemon", 
        "middlifier",
        "typescript"
    ], './gen');
    navigateTo('./gen', 'In index.ts, Line 79');
    // nodemon.json
    fs.writeFileSync('nodemon.json', arrayToString([
        '{',
        '   "ext": "ts",',
        '   "ignore": [".git", "node_modules/**/node_modules", "./**/*.spec.ts"],',
        '   "execMap": {',
        '       "ts": "node --require ts-node/register"',
        '   },',
        '   "watch": ["./src"]',
        '}'
    ]));
    // ---------------------------------------
    // tsconfig.json
    execSync("npx tsc --init");
    fs.writeFileSync('tsconfig.json', arrayToString([
        '{',
        '   "compilerOptions": {',
        '       "target": "ESNext",',
        '       "module": "NodeNext",',
        '       "outDir": "./dist",',
        '       "declaration": true,',
        '       "strict": true,',
        '       "esModuleInterop": true,',
        '       "moduleResolution": "NodeNext",',
        '   },',
        '   "include": ["src/**/*"],',
        '   "exclude": ["node_modules", "**/node_modules/*"]',
        '}'
    ]));
    // ---------------------------------------
    // package.json
    let packageJsonContent = fs.readFileSync('package.json', { encoding: 'utf-8', flag: 'r' });
    let packageJson = JSON.parse(packageJsonContent);
    packageJson.type = "module";
    packageJson.main = "dist/index.js";
    packageJson.types = "dist/index.d.ts";
    packageJson.files = ["/dist"];
    packageJson.scripts = {};
    packageJson.scripts.build = "npx tsc";
    packageJson.scripts.dev = "npm run build && nodemon index.ts"
    packageJson.scripts.start = "node dist/index.js";
    packageJsonContent = JSON.stringify(packageJson, null, 2);
    const formattedJson = packageJsonContent.replace(/\\/g, '\\\\');
    fs.writeFileSync('package.json', formattedJson);
    // ---------------------------------------
    createDirIfNotExistent('./src');
    navigateTo('./src', 'In index.ts, Line 125');
    fs.writeFileSync('mid.config.ts', arrayToString([
        'import { MidConfig } from "middlifier";',
        '',
        'export const config: MidConfig = {',
        '   port: 4000,',
        '}',
    ]));
    fs.writeFileSync('index.ts', arrayToString([
        'import { start } from "middlifier";',
        'import { config } from "./mid.config.js";',
        '',
        'start(config);',
    ]));
}

export function end(app: string, server: string)
{
    fs.renameSync(`./gen/${app}`, `./${app}`);
    fs.renameSync(`./gen/${server}`, `./${server}`);
    fs.rmSync('./gen', { recursive: true });
}

export function start(config: MidConfig)
{
    console.log('Current working directory: ', process.cwd());
    setupNode([
        "express",
        "nodemon",
        "cors"
    ], config.paths?.server ?? 'server');
    setupNode([], config.paths?.app ?? 'app');
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