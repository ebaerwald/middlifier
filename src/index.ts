import { _createDirIfNotExistent, _arrayToString, _setupNode, _encode, _write, _remove, _rename } from './helper';
import { buildApp } from './app/app';
import { buildServer } from './server/server';
import type { Config } from 'drizzle-kit';
import { PoolConfig } from 'pg';
import { packageTemp, tsconfigTemp, nodemonTemp, midConfigTempProd, indexTempProd, midConfigTempDev, indexTempDev} from './temp';
import { OptionsJson, OptionsUrlencoded } from 'body-parser';
import { CorsOptions } from 'cors';
import { ZodTypeAny } from 'zod';
import { IncomingHttpHeaders } from 'node:http2';
import { URL } from 'url';
import { CookieOptions } from 'express';

export type ReqConfig = {
    body?: {
        [key: string]: { type: ZodTypeAny };
    },
    params?: {
        [key: string]: { type: ZodTypeAny, urlencoded?: boolean };
    },
    dynamicRoute?: never
} | {
    body?: {
        [key: string]: { type: ZodTypeAny };
    },
    params?: never,
    dynamicRoute?: [string, ZodTypeAny],
    headers?: HeadersObj
};
export type ParamType = 'string' | 'number' | 'boolean' | ['string', {enum?: string[]}] | ['string', {regex?: RegExp}] | ['number', {min?: number, max?: number, literal?: number[]}] | {
    [key: string]: ParamType
} | [ParamType];
export type ResConfig = {
    [status: number]: {
        headers?: HeadersObj,
        send?: ZodTypeAny,
        json?: ZodTypeAny,
        redirect?: URL,
        cookies?: {
            [name: string]: {
                val: string,
                options: CookieOptions
            }
        }
        clientConfig?: {
            add?: boolean,
            store?: string
        }
    }
};
export type Methods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'CONNECT' | 'TRACE';
export type Structure = {
    routes?: Routes,
    funcs?: MidFuncs
}
export type MidFunc = {
    name: string, // name of the function
    path?: string, // relative path to the file
    method?: Methods,
    req?: ReqConfig,
    res?: ResConfig,
    funcs?: MidFuncs,
    route?: string // relative route to the routeKey
    routeKey?: string // identifier for the routes
    middleware?: boolean
} 
export type MidFuncs = MidFunc[];
export type Route = {
    path: string, 
    name: string,
    routes?: Routes,
    route: string // route for upper route 
}
export type Routes = Route[];

export type Secrets = {
    [key: string]: string
};

export type Server = {
    port: number | string,
    path?: string,
    host?: string,
    ssl?: boolean,
    structure: Structure,
    sets?: {
        [key: string]: any
    },
    cors?: CorsOptions,
    json?: OptionsJson,
    urlencoded?: OptionsUrlencoded,
    morgan?: string,
    drizzle?: {
        config: Config,
        dbConfig: PoolConfig,
        schemas?: Schemas
    },
    secrets?: Secrets,
    docker?: DockerConfig
};
export type rServer = Readonly<Server>;
type App = {
    path?: string,
    docker?: DockerConfig,
    stores?: {
        [name: string]: {
            
        }
    }
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
export type MidConfig = Readonly<{
    language?: string,
    server: Server,
    app: App
}>
export type RemoveIndexSignature<T> = {  
    [K in keyof T as string extends K
      ? never
      : number extends K
        ? never
        : symbol extends K
          ? never
          : K
    ]: T[K];
  }
export type HttpDefaultRequestHeaders = RemoveIndexSignature<IncomingHttpHeaders>  
export type HeadersObj = {
    [key in keyof HttpDefaultRequestHeaders]: string;
};

export function init()
{
    const arg = process.argv.slice(2)[0];
    let midConfigTemp = midConfigTempDev;
    let indexTemp = indexTempDev;
    if (arg == '-prod' || arg == '-p')
    {
        midConfigTemp = midConfigTempProd;
        indexTemp = indexTempProd;
    }
    _setupNode(["middlifier", "typescript"], './gen');
    process.chdir('./gen');
    _write('nodemon.json', _encode(nodemonTemp(["./src/mid.config.ts"])));
    _write('tsconfig.json', _encode(tsconfigTemp));
    _write('package.json', _encode({
        ...packageTemp,
        name: 'gen'
    }));
    _createDirIfNotExistent('./src');
    process.chdir('./src');
    _write('mid.config.ts', _arrayToString(midConfigTemp));
    _write('index.ts', _arrayToString(indexTemp));
}

export function end(app: string, server: string)
{
    if (process.cwd().includes('gen'))
    {
        process.chdir('..');
    }
    _rename(`./gen/${app}`, `./${app}`);
    _rename(`./gen/${server}`, `./${server}`);
    _remove('./gen');
}

export function start(config: MidConfig)
{
    buildServer(config);
}