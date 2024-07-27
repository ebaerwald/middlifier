import { CorsOptions } from 'cors';
import { Server, MidFuncs, Secrets, Routes, MidFunc, ParamType, ReqConfig, Methods, ResConfig } from '../index';
import { _arrayToString, _write, _encode, type Imports, _getVarValue, _splitArrayByKeys } from '../helper';
import { OptionsJson, OptionsUrlencoded } from 'body-parser';
import path from 'path';

type RouteInfo = {
    name: string,
    route?: string
}
    
type RoutesInfo = RouteInfo[];

type FuncInfo = {
    name: string,
    req: ReqConfig,
    path: boolean,
    method?: Methods,
    route?: string,
    dynamicRoute?: string
}

type FuncsInfo = FuncInfo[];

type RouteFuncInfo = {
    path: string,
    name: string,
    req: ReqConfig,
    res?: ResConfig,
    method?: Methods,
    route?: string
    funcPathFromEntryPoint: string
}

type RouteFuncsInfo = RouteFuncInfo[];

type FinalObj = {
    absoluteRoute: string,
    funcPathFromEntryPoint: string,
    method?: Methods, // method
    req: ReqConfig, 
    res?: ResConfig,
    funcName: string
}

export type FinalObjs = {
    [routeName: string]: FinalObj[]
}

let finalObjs: FinalObjs = {};

export function buildServerStructure(server: Server)
{
    const { structure, cors, secrets, port, json, urlencoded, morgan, sets } = server;
    const { routes, funcs } = structure;
    const serverInfo = buildEntryFile(routes, funcs, cors, secrets, port, json, urlencoded, morgan, sets);
    return serverInfo;
}

function buildEntryFile(
    rout: Routes | undefined, 
    funcs: MidFuncs | undefined, 
    cors: CorsOptions | undefined, 
    secrets: Secrets | undefined, 
    port: string | number, 
    json: OptionsJson | undefined, 
    urlencoded: OptionsUrlencoded | undefined,
    morgan: string | undefined,
    sets: { [key: string]: any } | undefined
): FinalObjs
{
    let configPointer = ["server", "structure"];
    let f = funcs;
    const bottomLines: string[] = [];
    const topLines: string[] = ['import express from "express";'];
    if (cors) topLines.push('import cors from "cors";');
    if (secrets) topLines.push('import dotenv from "dotenv";', 'dotenv.config();');
    if (morgan) topLines.push('import morgan from "morgan";');
    let imports: Imports = {};
    if (rout)
    {
        for (let j = 0; j < rout.length; j++)
        {
            const {path, name, routes, route} = rout[j];
            route ? `${route}, `: '';
            if (!imports[path]) imports[path] = [];
            imports[path].push(name);
            bottomLines.push(`app.use("${route}", ${name});`);
            buildRoute(`${path}.ts`, name, getSubFuncsWithRouteKey(name, path, funcs ?? []), getSubRoutes(routes ?? []), route);
            buildRoutes(routes ?? [], funcs ?? [], path, route);
        }
    }
    if (f)
    {
        for (let i = 0; i < f.length; i++)
        {
            configPointer.push(...["funcs", i.toString()])
            let {path, name, req, funcs, middleware, res} = f[i];
            if (path)
            {
                if (!imports[path]) imports[path] = [];
                imports[path].push(name);
                if (middleware) bottomLines.push(`app.use(${name});`);
                buildMidFunc(`${path}.ts`, name, req ?? {}, res ?? {}, getSubFuncs(funcs ?? []), [...configPointer]);
                buildMidFuncs(funcs ?? [], `${path}.ts`, [...configPointer]);
            }
        }
    }
    for (const path in imports)
    {
        const importNames = imports[path];
        topLines.push(`import { ${importNames.join(', ')} } from "${path}";`);
    }
    if (cors) bottomLines.push(`app.use(cors(${_encode(cors)}));`);
    if (json) bottomLines.push(`app.use(express.json(${_encode(json)};`);
    if (urlencoded) bottomLines.push(`app.use(express.urlencoded(${_encode(urlencoded)}));`);
    if (morgan) bottomLines.push(`app.use(morgan(${morgan}));`);
    for (const setKey in sets)
    {
        const set = sets[setKey];
        bottomLines.push(`app.set('${setKey}', ${_encode(set)})`);
    }
    _write('index.ts', _arrayToString([
        ...topLines,
        '',
        'const app = express()',
        '',
        ...bottomLines,
        '',
        `app.listen(${port}, () => console.log('Server running on port ${port}'));`
    ]));
    for (const routeName in finalObjs)
    {
        const routeObj = finalObjs[routeName];
        buildDocu(routeName, routeObj);
        buildTest(routeName, routeObj);
    }
    return finalObjs;
}

function buildRoutes(rout: Routes, funcs: MidFuncs, pathFromEntryPoint: string, currentRoute: string)
{
    for (let i = 0; i < rout.length; i++)
    {
        const route = rout[i];
        const {path, name, routes} = route;
        const subRoutes = getSubRoutes(routes ?? []);
        const currentPath = getPathFromEntryPoint(pathFromEntryPoint, path);
        buildRoute(`${currentPath}.ts`, name, getSubFuncsWithRouteKey(name, currentPath, funcs), subRoutes, currentRoute);
        buildRoutes(routes ?? [], funcs ?? [], `${path}.ts`, `${currentRoute}${route}`);
    }
}

function buildRoute(path: string, routeName: string, subFuncs: [string[], RouteFuncsInfo], subRoutes: [string[], RoutesInfo], absoluteRoute: string)
{
    const [routesImports, routesInfo] = subRoutes;
    const [funcsImports, funcsInfo] = subFuncs;
    finalObjs[routeName] = [];
    const content: string[] = [`export const ${routeName} = Router();`, ''];
    for (const r of routesInfo)
    {
        const {name, route} = r;
        route ? `${route}, `: '';
        content.push(`${routeName}.use("${route}", ${name});`);
    }
    for (const f of funcsInfo)
    {
        let {name, route, req, method, res, funcPathFromEntryPoint} = f
        finalObjs[routeName].push({
            absoluteRoute: absoluteRoute,
            funcPathFromEntryPoint: funcPathFromEntryPoint,
            funcName: name,
            req: req,
            res: res,
            method: method,

        })
        const dynamicRoute = req.dynamicRoute ? `/:${req.dynamicRoute[0]}` : '';
        const finalRoute = route ? `${route}${dynamicRoute}` : '""';
        content.push(`${routeName}.route(${finalRoute}).${method?.toLowerCase() ?? 'all'}(${name});`);
    }
    _write(path, _arrayToString([
        'import { Router } from "express";',
        ...routesImports,
        ...funcsImports,
        '',
        ...content
    ]))
}

function buildMidFuncs(midFuncs: MidFuncs, pathFromEntryPoint: string = '', configPointer: string[])
{
    configPointer.push("funcs");
    for (let i = 0; i < midFuncs.length; i++)
    {
        const f = midFuncs[i];
        const {path, name, req, funcs, res} = f;
        if (path)
        {
            const currentPath = getPathFromEntryPoint(pathFromEntryPoint, path);
            buildMidFunc(`${currentPath}.ts`, name, req ?? {}, res ?? {}, getSubFuncs(funcs ?? []), [...configPointer, i.toString()]);
            if (funcs) return buildMidFuncs(funcs, currentPath, [...configPointer, i.toString()]);
        }
    }
}

function getPathFromEntryPoint(pathFromEntryPoint: string, relativePath: string)
{
    if (pathFromEntryPoint === '') return relativePath;
    let resultPath: string[] = pathFromEntryPoint.split('/').filter(item => item !== '');
    resultPath = resultPath.slice(0, resultPath.length - 1);
    const relativePathSplit = relativePath.split('/').filter(item => item !== '');
    for (const part of relativePathSplit)
    {
        if (part == '.') continue;
        else if (part == '..')
        {
            resultPath.pop();
        }
        else
        {
            resultPath.push(part);
        }
    }
    return resultPath.join('/');
}

function getPath(from: string, to: string)
{
    if (from === '') return to;
    if (to === '') return '';
    let resultPath: string[] = [];
    const fromSplit = from.split('/').slice(1);
    const toSplit = to.split('/').slice(1);
    for (let i = 0; i < toSplit.length; i++)
    {
        const fromPart = fromSplit[i];
        const toPart = toSplit[i];
        if (fromPart === toPart) continue;
        resultPath = [
            ...resultPath,
            ...Array(fromSplit.length - (i + 1)).fill('..'),
            ...toSplit.slice(i)
        ];
        break;
    }
    const firstElement = resultPath[0];
    if (firstElement !== '..') resultPath = ['.', ...resultPath];
    return `${resultPath.join('/')}`;
}

function getSubRoutes(routes: Routes): [string[], RoutesInfo]    
{
    const importArray: string[] = [];
    const subRoutes: Imports = {};
    const routesInfo: {
        name: string,
        route?: string
    }[] = [];
    for (const f of routes)
    {
        const {path, name, route} = f;
        routesInfo.push({
            name: name, 
            route: route
        });
        if (!subRoutes[path]) subRoutes[path] = [];
        subRoutes[path].push(name);
    }
    for (const path in subRoutes)
    {
        importArray.push(`import { ${subRoutes[path].join(', ')} } from "${path}";`);
    }
    return [importArray, routesInfo]
}

function getSubFuncsWithRouteKey(key: string, routePath: string, f: MidFuncs, cPath: string = '', importsObj: Imports = {}, funcsInfo: RouteFuncsInfo = []): [string[], RouteFuncsInfo]
{
    for (const func of f)
    {
        const {path, name, req, funcs, route, routeKey, method} = func;
        const currentFuncPath = getPathFromEntryPoint(cPath, path ?? '');
        const routeToFuncPath = getPath(routePath, currentFuncPath);
        if (routeKey === key)
        {
            if (!importsObj[routeToFuncPath]) importsObj[routeToFuncPath] = [];
            importsObj[routeToFuncPath].push(name);
            funcsInfo.push({
                path: routeToFuncPath,
                name: name,
                req: req ?? {},
                method: method,
                route: route, 
                funcPathFromEntryPoint: currentFuncPath
            });
        }
        return getSubFuncsWithRouteKey(key, routePath, funcs ?? [], currentFuncPath, importsObj, funcsInfo);
    }
    const importArr: string[] = [];
    for (const path in importsObj)
    {
        importArr.push(`import { ${importsObj[path].join(', ')} } from "${path}";`);
    }
    return [importArr, funcsInfo];
}

function getSubFuncs(midFuncs: MidFuncs, imports: Imports = {}, funcsInfo: FuncsInfo = []): [string[], FuncsInfo]
{
    const importArr: string[] = [];
    for (let i = 0; i < midFuncs.length; i++)
    {
        const {path, name, method, funcs, route, req} = midFuncs[i];
        const funcInfo: FuncInfo = {
            name: name,
            method: method,
            route: route,
            req: req ?? {},
            path: true
        };
        if (path)
        {
            if (!imports[path]) imports[path] = [];
            imports[path].push(name);
            const dynamicRoute = req?.dynamicRoute;
            if (Array.isArray(dynamicRoute))
            {
                funcInfo['dynamicRoute'] = dynamicRoute[0];
            }
            funcsInfo.push(funcInfo);
        }
        else
        {
            funcInfo.path = false;
            funcsInfo.push(funcInfo);
            return getSubFuncs([...midFuncs.slice(i + 1, midFuncs.length) ,...(funcs ?? [])], imports, funcsInfo);
        }
    }
    for (const path in imports)
    {
        importArr.push(`import { ${imports[path].join(', ')} } from "${path}";`);
    }
    return [importArr, funcsInfo];
}

function buildMidFunc(path: string, name: string, req: ReqConfig, res: ResConfig, subFuncs: [string[], FuncsInfo], configPointer: string[])
{
    const subFuncImports = subFuncs[0];
    const funcsInfo = subFuncs[1];
    configPointer.push(...["func", "req"]);
    const topLines: string[] = [
        'import { Request, Response, NextFunction } from "express";',
        'import { z } from "zod";',
        ...subFuncImports
    ];
    const funcLines: string[] = [];
    if (req)
    {
        const { dynamicRoute, params, body } = req;
        funcLines.push(_arrayToString(['', `export async function ${name}(req: Request, res: Response, next: NextFunction) {`]))
        if (dynamicRoute)
        {
            funcLines.push(...getZodLines(req['dynamicRoute'], 'dynamicRoute', [...configPointer, "dynamicRoute"]));
        }
        else if (params)
        {
            funcLines.push(...getZodLines(req['params'], 'params', [...configPointer, "params"]));
        }
        if (body)
        {
            funcLines.push(...getZodLines(req['body'], 'body', [...configPointer, "body"]));
        }
        funcLines.push('}');
    }
    if (res)
    {
        funcLines.pop();
        for (const status in res)
        {
            const { headers, send, json, redirect, cookies } = res[status];
            const resLines: string[] = [];
            if (headers)
            {
                resLines.push(`res.status(${status}).set(${_encode(headers)});`);
            }
            if (send)
            {
                resLines.push(`res.status(${status}).send(${send});`);
            }
            if (json)
            {
                resLines.push(`res.status(${status}).json(${json});`);
            }
            if (redirect)
            {
                resLines.push(`res.status(${status}).redirect(${redirect});`);
            }
            if (cookies)
            {
                for (const name in cookies)
                {
                    const { val, options } = cookies[name];
                    resLines.push(`res.cookie(${name}, ${val}, ${_encode(options)});`);
                }
            }
            funcLines.push(...resLines);
        }
        funcLines.push('}');
    }
    const subFuncLines: string[] = []
    for (const funcInfo of funcsInfo)
    {
        const { path, req, name } = funcInfo;
        if (!path && req)
        {
            const { dynamicRoute, body, params } = req;
            subFuncLines.push(_arrayToString(['', `export async function ${name}(req: Request, res: Response, next: NextFunction) {`]));
            if (dynamicRoute)
            {
                subFuncLines.push(...getZodLines(req['dynamicRoute'], 'dynamicRoute', [...configPointer, "dynamicRoute"]));
            }
            else if (params)
            {
                subFuncLines.push(...getZodLines(req['params'], 'params', [...configPointer, "params"]));
            }
            if (body)
            {
                subFuncLines.push(...getZodLines(req['body'], 'body', [...configPointer, "body"]));
            }
            subFuncLines.push('}');
        }
    }
    _write(path, _arrayToString([
        ...topLines,
        ...funcLines,
        ...subFuncLines
    ]));
}

function getZodLines(data: any, paramType: keyof ReqConfig, configPointer: string[])
{
    let frontStr = 'z.object({ ';
    let backStr = '})';
    const paramNames: string[] = [];
    if (paramType === 'params' || paramType === 'body')
    {
        const zodElements: string[] = [];
        for (const key in data)
        {
            paramNames.push(key);
            const type = _getVarValue('../../src/mid.config.ts', [...configPointer, key, "type"].join("."));
            zodElements.push(`${key}: ${type}`);
        }
        frontStr += zodElements.join(', ');
    }
    else
    {
        let [ paramName, type ] = data;
        type = _encode(type);
        paramNames.push(paramName);
        frontStr += `${paramName}: ${type}, `
    }
    const paramLocation = paramType === 'dynamicRoute' ? 'params' : paramType;
    const zodStr = frontStr + backStr;
    return [
        `   const ${paramLocation}Schema = ${zodStr};`,
        `   const ${paramLocation} = req.${paramLocation} as z.infer<typeof ${paramLocation}Schema>;`,
        `   ${paramLocation}Schema.parse(${paramLocation});`,
        `   const { ${paramNames.join(', ')} } = ${paramLocation};`
    ]
}

function buildTest(routeName: string, obj: FinalObj[])
{
    for (const element of obj)
    {
        const {absoluteRoute, funcPathFromEntryPoint, method, req, res, funcName} = element;
        const name = routeName
    }
}

function buildDocu(routeName: string, obj: FinalObj[])
{
    for (const element of obj)
    {
        const {absoluteRoute, funcPathFromEntryPoint, method, req, res, funcName} = element;
    }
}