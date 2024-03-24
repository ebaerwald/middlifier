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