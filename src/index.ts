import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { createDirIfNotExistent, arrayToString, setupNode } from './helper';
import { buildApp } from './app/app';
import { buildServer } from './server/server';
import type { Config } from 'drizzle-kit';
import { PoolConfig } from 'pg';
import { packageTemp, tsconfigTemp, nodemonTemp, midConfigTemp, indexTemp} from './temp';
// import { TableConfig } from 'drizzle-orm/pg-core';

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
    language?: string,
    server: {
        port: number,
        path?: string,
        host?: string,
        ssl?: boolean,
        cors?: boolean,
        routes?: {
            [key: string]: Controller | {
                [key: string]: Controller | {
                    [key: string]: Controller | {
                        [key: string]: Controller
                    };
                };
            };
        },
        drizzle?: {
            config: Config,
            dbConfig: PoolConfig,
            schemas?: {
                [key: string]: any
            }
        },
        middlewares?: Service,
        docker?: DockerConfig,
    },
    app: {
        path?: string,
        docker?: DockerConfig,
    }
}

export function init()
{
    setupNode(["nodemon", "middlifier", "typescript", "ts-node"], './gen');
    process.chdir('./gen');
    fs.writeFileSync('nodemon.json', JSON.stringify(nodemonTemp, null, 2).replace(/\\/g, '\\\\'));
    fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfigTemp, null, 2).replace(/\\/g, '\\\\'));
    fs.writeFileSync('package.json', JSON.stringify({
        ...packageTemp,
        name: 'gen'
    }, null, 2).replace(/\\/g, '\\\\'));
    createDirIfNotExistent('./src');
    process.chdir('./src');
    fs.writeFileSync('mid.config.ts', arrayToString(midConfigTemp));
    fs.writeFileSync('index.ts', arrayToString(indexTemp));
}

export function end(app: string, server: string)
{
    fs.renameSync(`./gen/${app}`, `./${app}`);
    fs.renameSync(`./gen/${server}`, `./${server}`);
    fs.rmSync('./gen', { recursive: true });
}

export function start(config: MidConfig)
{
    setupNode(["express", "nodemon", "cors"], config.server.path ?? 'server');
    setupNode([], config.server.path ?? 'app');
    buildServer(config);
    // console.log(process.cwd())
    buildApp(config);
}