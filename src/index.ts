import { _createDirIfNotExistent, _arrayToString, _setupNode, _encode, _write, _remove, _rename } from './helper';
import { buildApp } from './app/app';
import { buildServer } from './server/server';
import type { Config } from 'drizzle-kit';
import { PoolConfig } from 'pg';
import { packageTemp, tsconfigTemp, nodemonTemp, midConfigTempProd, indexTempProd, midConfigTempDev, indexTempDev} from './temp';
import { OptionsJson, OptionsUrlencoded } from 'body-parser';
import { CorsOptions } from 'cors';
import { $ } from 'bun';

export type ReqConfig = {
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
export type ParamType = 'string' | 'number' | 'boolean' | ['string', {enum?: string[]}] | ['string', {regex?: RegExp}] | ['number', {min?: number, max?: number, literal?: number[]}] | {
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
    routes?: Routes,
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
export type MidConfig = Readonly<{
    language?: string,
    server: Server,
    app: App
}>

/**
 * @param {string} path Path of the routes, for the index routes use "-" 
 * @param {InnerRoute} InnerRoute
 */
export type Routes = {
    [path: string]: InnerRoute
}

/**
 * @param {string} route Routes can be nested.
 * @param {InnerRoute} InnerRoute
 */
export type InnerRoute = {
    [route: string]: InnerRoute | ([string] | [string, string])[] // funcName or funcName and path, if path search path in Routes, if not search funcName in Midfuncs
}

export type FinalRouteObj = {
    [path: string]: FinalInnerRoute
}

export type FinalInnerRoute = {
    [route: string]: FinalInnerRoute | FuncInfo[]
}

/**
* @param {string} funcPath - first
* @param {string} funcName - second
* @param {string | undefined} method - third
* @param {string | undefined} dynamicRoute - fourth
*/
export type FuncInfo = [string, string] | [string, string, string] | [string, string, string, string];

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
    buildApp(config);
}