import { CorsOptions } from 'cors';
import { Server, MidFuncs, Secrets, Routes, MidFunc, ParamType, ReqConfig, Methods, ResConfig } from '../index';
import { _arrayToString, _write, _encode, type Imports, _getVarValue } from '../helper';
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
    method?: Methods,
    route?: string
}

type RouteFuncsInfo = RouteFuncInfo[];

type TestObj = {
    [route: string]: [
        Methods, // method
        ReqConfig, 
        ResConfig
    ] | TestObj
}

export function buildServerStructure(server: Server)
{
    const { structure, cors, secrets, port, json, urlencoded, morgan, sets } = server;
    const { routes, funcs } = structure;
    buildEntryFile(routes, funcs, cors, secrets, port, json, urlencoded, morgan, sets);
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
)
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
            bottomLines.push(`app.use(${route}${name});`);
            buildRoute(path, name, getSubFuncsWithRouteKey(name, `${path}.ts`, funcs ?? []), getSubRoutes(routes ?? []));
            buildRoutes(routes ?? [], funcs ?? [], `${path}.ts`);
        }
    }
    if (f)
    {
        for (let i = 0; i < f.length; i++)
        {
            configPointer.push(...["funcs", i.toString()])
            let {path, name, req, funcs} = f[i];
            if (path)
            {
                if (!imports[path]) imports[path] = [];
                imports[path].push(name);
                bottomLines.push(`app.use(${name});`);
                buildMidFunc(`${path}.ts`, name, req ?? {}, getSubFuncs(funcs ?? []), [...configPointer]);
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
    ]))
}

function buildRoutes(rout: Routes, funcs: MidFuncs, pathFromEntryPoint: string = '')
{
    for (let i = 0; i < rout.length; i++)
    {
        const route = rout[i];
        const {path, name, routes} = route;
        const subRoutes = getSubRoutes(routes ?? []);
        const currentPath = getPathFromEntryPoint(pathFromEntryPoint, path);
        buildRoute(`${currentPath}.ts`, name, getSubFuncsWithRouteKey(name, `${currentPath}.ts`, funcs), subRoutes);
    }
}

function buildRoute(path: string, routeName: string, subFuncs: [string[], RouteFuncsInfo], subRoutes: [string[], RoutesInfo])
{
    const [routesImports, routesInfo] = subRoutes;
    const [funcsImports, funcsInfo] = subFuncs;
    const content: string[] = [
        `export const ${routeName} = Router();`,
        '{',

    ];
    for (const r of routesInfo)
    {
        const {name, route} = r;
        route ? `${route}, `: '';
        content.push(`${routeName}.use(${route}${name});`);
    }
    for (const f of funcsInfo)
    {
        let {name, route, req, method} = f
        const dynamicRoute = req.dynamicRoute ? `/:${req.dynamicRoute[0]}` : '';
        content.push(`${routeName}.route(${`${route}${dynamicRoute}` ?? ''}).${method ?? 'all'}(${name});`);
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
        const {path, name, req, funcs} = f;
        if (path)
        {
            const currentPath = getPathFromEntryPoint(pathFromEntryPoint, path);
            buildMidFunc(`${currentPath}.ts`, name, req ?? {}, getSubFuncs(funcs ?? []), [...configPointer, i.toString()]);
            if (funcs) return buildMidFuncs(funcs, currentPath, [...configPointer, i.toString()]);
        }
    }
}

function getPathFromEntryPoint(pathFromEntryPoint: string, relativePath: string)
{
    let resultPath = pathFromEntryPoint == '' ? './' : path.dirname(pathFromEntryPoint);
    const relativePathSplit = relativePath.split('/');
    for (const part of relativePathSplit)
    {
        if (part == '.') continue;
        else if (part == '..')
        {
            resultPath = path.dirname(resultPath);
        }
        else
        {
            resultPath = `${resultPath}/${part}`;
        }
    }
    return resultPath;
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
        const routeToFuncPath = getPathFromEntryPoint(routePath, currentFuncPath);
        if (routeKey === key)
        {
            if (!importsObj[cPath]) importsObj[cPath] = [];
            importsObj[cPath].push(name);
            funcsInfo.push({
                path: routeToFuncPath,
                name: name,
                req: req ?? {},
                method: method,
                route: route
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

function buildMidFunc(path: string, name: string, req: ReqConfig, subFuncs: [string[], FuncsInfo], configPointer: string[])
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


function buildTestsAndDoku(testObj: TestObj, testLines: string[] = [], dokuLines: string[] = [])
{
    for (const route in testObj)
    {
        const value = testObj[route];
        if (Array.isArray(value))
        {
            const [method, req, res] = value;
            testLines.push(...buildTest(route, method, req, res));
            dokuLines.push(...buildDoku(route, method, req, res));
        }
        else
        {
            return buildTestsAndDoku(value, testLines, dokuLines);
        }
    }
}

function buildTest(route: string, method: Methods, req: ReqConfig, res: ResConfig): string[]
{
    return [];
}

function buildDoku(route: string, method: Methods, req: ReqConfig, res: ResConfig): string[]
{
    return [];
}