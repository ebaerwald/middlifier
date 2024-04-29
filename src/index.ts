import fs from 'fs';
import { createDirIfNotExistent, arrayToString, setupNode } from './helper';
import { buildApp } from './app/app';
import { buildServer } from './server/server';
import type { Config } from 'drizzle-kit';
import { PoolConfig } from 'pg';
import { packageTemp, tsconfigTemp, nodemonTemp, midConfigTemp, indexTemp} from './temp';
import { OptionsJson, OptionsUrlencoded } from 'body-parser';
import { CorsOptions } from 'cors';

type ReqConfig = {
    body?: {
        [key: string]: { type: ParamType, required?: boolean };
    },
    params?: {
        [key: string]: { type: ParamType, required?: boolean, urlencoded?: boolean };
    },
    dynamicRoute?: never
} | {
    body?: {
        [key: string]: { type: ParamType, required?: boolean };
    },
    params?: never,
    dynamicRoute?: string
};
export type ParamType = 'string' | 'number' | 'boolean' | {
    [key: string]: ParamType
} | [ParamType];
type ResConfig = {};
export type MidFunc = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'CONNECT' | 'TRACE',
    req?: ReqConfig,
    res?: ResConfig,
};
export type MidFuncs = {
    [path: string]: {
        [fileName: string]: {
            [funcName: string]: MidFunc 
        }
    }
};
type Server = {
    port: number | string, // string if you get the variable from .env file
    path?: string,
    host?: string,
    ssl?: boolean,
    set?: {
        [key: string]: any
    },
    cors?: CorsOptions,
    funcs: MidFuncs,
    indexFuncNames?: string[],
    routes?: FinalRoutes,
    json?: OptionsJson,
    urlencoded?: OptionsUrlencoded,
    drizzle?: {
        config: Config,
        dbConfig: PoolConfig,
        schemas?: Schemas
    },
    secrets?: {
        [key: string]: string
    },
    docker?: DockerConfig
};
export type rServer = Readonly<Server>;
type App = {
    path?: string,
    docker?: DockerConfig,
};
export type rApp = Readonly<App>;
type DockerCommands = 'FROM' | 'RUN' | 'CMD' | 'LABEL' | 'EXPOSE' | 'ENV' | 'ADD' | 'COPY' | 'ENTRYPOINT' | 'VOLUME' | 'USER' | 'WORKDIR' | 'ARG' | 'ONBUILD' | 'STOPSIGNAL' | 'HEALTHCHECK' | 'SHELL';
type DockerConfig = [
    DockerCommands,
    string
][];
type Schema = {
    [key: string]: {
        type: 'serial' | 'text' | 'integer' | 'real',
        name: string,
        primaryKey?: boolean
    }
};
export type rSchema = Readonly<Schema>;
type Schemas = {
    [key: string]: Schema  
};
export type Routes = {
    [key: string]: Routes | [
        {
            [key: string]: Routes
        },
        [string] | [string, string] // [path] or [path, funcName]
    ]
};
export type FinalRoutes = {
    [key: string]: Routes
}
export type MidConfig = Readonly<{
    language?: string,
    server: Server,
    app: App
}>

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
    setupNode(["express", "nodemon", "cors", "dotenv", "zod"], config.server.path ?? 'server');
    setupNode([], config.server.path ?? 'app');
    buildServer(config);
    // console.log(process.cwd())
    buildApp(config);
}