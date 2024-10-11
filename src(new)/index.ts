import { _create, _encode, _decode, _read, _setupNode, _isBunInstalled, _arrayToString, _rename, _remove, _createStore } from "./helper";
import { midConfigTempDev, midConfigTempProd, indexTempDev, indexTempProd, nodemonTemp, packageTemp, tsconfigTemp } from "./temp";
import { buildServer } from "./server";
import { buildApp } from "./app";
import { CorsOptions } from 'cors';
import { OptionsJson, OptionsUrlencoded } from 'body-parser';
import type { Config } from 'drizzle-kit';
import { PoolConfig } from 'pg';
import fs from 'fs';
import { ZodArray, ZodTypeAny, ZodString, z} from "zod";
import { AxiosInterceptorOptions, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { UseBoundStore, StoreApi, StateCreator } from "zustand";

export type MidConfig = {
    server: ServerOptions,
    app: AppOptions
};

export type Secrets = {
    [key: string]: string
}

export type ServerOptions = {
    port: number,
    path?: string,
    express?: ExpressOptions,
    secrets?: Secrets,
    docker?: DockerConfig,
    drizzle?: {
        config: Config,
        db: PoolConfig,
        schemas?: Schemas
    },
    structure: Structure
}

export type Structure = {
    routes?: Routes, 
    funcs?: MidFuncs
}

export type Route = {
    path: string,
    name: string,
    routes?: Routes,
    route: string // passing params in the route
}

export type Routes = Route[];

export type MidFunc = {
    path?: string,
    funcs: InnerFunc[]
}

export type InnerFunc = {
    name: string,
    route?: string, // passing params in the route
    routeKey?: string,
    method?: Methods,
    req?: ReqConfig,
    res?: Responses
}

export type ReqConfig = {
    body?: Body,
    params?: Params,
    query?: Query,
    headers?: Headers,
    cookies?: Cookies
}

export type Responses = {
    [status: number]: {
        type: ZodTypeAny,
        store?: string,
        method?: string
    }
}

export type ServerInfo = {
    [routeKey: string]: {
        absoluteRoute: string,
        funcPathFromEntryPoint: string,
        method?: Methods, // method
        req: ReqConfig, 
        res?: Responses,
        funcName: string
    }[]
}

export type Body = {
    [key: string]: ZodTypeAny
} | ZodArray<ZodTypeAny>;

export type Query = {
    [key: string]: ZodString | ZodArray<ZodString>
};

export type Headers = {
    [key: string]: ZodString | ZodArray<ZodString>
}

export type Params = {
    [key: string]: ZodString
}

export type Cookies = {
    [key: string]: ZodString
}

export type Methods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'CONNECT' | 'TRACE';

export type MidFuncs = MidFunc[];

export type Schema = {
    [key: string]: {
        type: 'serial' | 'text' | 'integer' | 'real',
        name: string,
        primaryKey?: boolean
    }
};
export type Schemas = {
    [key: string]: Schema  
};

export type DockerCommands = 'FROM' | 'RUN' | 'CMD' | 'LABEL' | 'EXPOSE' | 'ENV' | 'ADD' | 'COPY' | 'ENTRYPOINT' | 'VOLUME' | 'USER' | 'WORKDIR' | 'ARG' | 'ONBUILD' | 'STOPSIGNAL' | 'HEALTHCHECK' | 'SHELL';
export type DockerConfig = [
    DockerCommands,
    string
][];

export type ExpressOptions = {
    morgan?: string,
    cors?: CorsOptions,
    json?: OptionsJson,
    urlencoded?: OptionsUrlencoded,
    sets?: {
        [key: string]: any
    },
    cookies?: boolean
}

export type AppOptions = {
    path?: string,
    docker?: DockerConfig,
    zustand?: Zustand,
    axiosInstance?: {
        baseURL: string,
        req?: {
            onFulfilled?: ((value: InternalAxiosRequestConfig<any>) => InternalAxiosRequestConfig<any> | Promise<InternalAxiosRequestConfig<any>>),
            onRejected?: ((error: any) => any) | null, options?: AxiosInterceptorOptions
        }
        res?: {
            onFulfilled?: ((value: AxiosResponse<any, any>) => AxiosResponse<any, any> | Promise<AxiosResponse<any, any>>) | null,
            onRejected?: ((error: any) => any) | null, options?: AxiosInterceptorOptions
        }
    }
}

export type Zustand = {
    [name: string]: {
        store: <T extends ZodTypeAny>(stateSchema: T, stateCreator: StateCreator<z.infer<T>>) => UseBoundStore<StoreApi<z.TypeOf<T>>>
    }
}

export type PackageManager = 'npm' | 'bun';

const packageManager: PackageManager = _isBunInstalled() ? 'bun' : 'npm';

export function init()
{
    const arg = process.argv.slice(2)[0];
    let midConfigTemp = midConfigTempProd;
    let indexTemp = indexTempProd;
    if (arg == '-dev' || arg == '-d')
    {
        midConfigTemp = midConfigTempDev;
        indexTemp = indexTempDev;
    }
    _setupNode(["middlifier", "typescript"], './gen', packageManager, true);
    _create('nodemon.json', {content: _encode(nodemonTemp(["./src/mid.config.ts"]))});
    _create('tsconfig.json', {content: _encode(tsconfigTemp)});
    _create('package.json', {content: _encode({
        ...packageTemp,
        name: 'gen'
    })});
    _create('./src', {chdir: true});
    if (fs.existsSync('../../mid.config.ts'))
    {
        _rename('../../mid.config.ts', './mid.config.ts');
    }
    _create('mid.config.ts', {
        content: _arrayToString(midConfigTemp),
        replace: false
    });
    _create('index.ts', {content: _arrayToString(indexTemp)});
}

export function start(midConfig: MidConfig)
{
    const serverInfo: ServerInfo = buildServer(midConfig, packageManager);
    buildApp(midConfig);
}

export function end()
{
    const args = process.argv.slice(2);
    let app = 'app';
    let server = 'server';
    let lastArg = '';
    for (const arg of args)
    {
        if (lastArg == arg) continue;
        if (lastArg == '-a')
        {
            app = arg;
        }
        if (lastArg == '-s')
        {
            server = arg;
        }
        lastArg = arg;
    }
    if (process.cwd().includes('gen'))
    {
        process.chdir('..');
    }
    _rename(`./gen/src/mid.config.ts`, `./mid.config.ts`);
    _rename(`./gen/${app}`, `./${app}`);
    _rename(`./gen/${server}`, `./${server}`);
    _remove('./gen');
}