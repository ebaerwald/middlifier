import { CorsOptions } from 'cors';
import { Server, MidFuncs, Secrets, Routes, MidFunc, ParamType, ReqConfig, Methods, ResConfig } from '../index';
import { _arrayToString, _write, _encode } from '../helper';
import { OptionsJson, OptionsUrlencoded } from 'body-parser';
import path from 'path';

type Imports = {
    [path: string]: string[];
}

type RouteInfo = {
    name: string,
    route?: string
}
    
type RoutesInfo = RouteInfo[];

type FuncInfo = {
    name: string,
    method?: string,
    route?: string,
    dynamicRoute?: string
}

type FuncsInfo = FuncInfo[];

type TestObj = {
    [route: string]: [
        Methods, // method
        ReqConfig, 
        ReqConfig
    ] | TestObj
}

export function buildServerStructure(server: Server)
{
    const { structure, cors, secrets, port, json, urlencoded, sets } = server;
    const { routes, funcs } = structure;
    buildEntryFile(routes, funcs, cors, secrets, port, json, urlencoded, sets);
}

function buildEntryFile(
    routes: Routes | undefined, 
    funcs: MidFuncs | undefined, 
    cors: CorsOptions | undefined, 
    secrets: Secrets | undefined, 
    port: string | number, 
    json: OptionsJson | undefined, 
    urlencoded: OptionsUrlencoded | undefined,
    sets: { [key: string]: any } | undefined
)
{
    const bottomLines: string[] = [];
    const topLines: string[] = ['import express from "express";'];
    if (cors) topLines.push('import cors from "cors";');
    if (secrets) topLines.push('import dotenv from "dotenv";', 'dotenv.config();');
    let imports: Imports = {};
    if (routes)
    {
        for (const r of routes)
        {
            const {path, name, struct, route} = r;
            route ? `${route}, `: '';
            if (!imports[path]) imports[path] = [];
            imports[path].push(name);
            bottomLines.push(`app.use(${route}${name});`);
            buildRoute(path, name, getSubFuncs(struct.funcs ?? []), getSubRoutes(struct.routes ?? []));
            buildRoutes(struct.routes ?? [], `${path}/${name}.ts`);
        }
    }
    if (funcs)
    {
        for (const f of funcs)
        {
            const {path, name, func, funcs} = f;
            if (!imports[path]) imports[path] = [];
            imports[path].push(name);
            bottomLines.push(`app.use(${name});`);
            buildMidFunc(`${path}/${name}.ts`, name, func, getSubFuncs(funcs ?? [])[0]);
            buildMidFuncs(funcs ?? [], `${path}/${name}.ts`);
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

function buildRoutes(routes: Routes, pathFromEntryPoint: string = '')
{
    for (const route of routes)
    {
        const {path, name, struct} = route;
        const subFuncs = getSubFuncs(struct.funcs ?? []);
        const subRoutes = getSubRoutes(struct.routes ?? []);
        const currentPath = getPathFromEntryPoint(pathFromEntryPoint, path);
        buildRoute(`${currentPath}.ts`, name, subFuncs, subRoutes);
    }
}

function buildRoute(path: string, routeName: string, subFuncs: [string[], FuncsInfo], subRoutes: [string[], RoutesInfo])
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
        let {name, route, dynamicRoute, method} = f
        dynamicRoute = dynamicRoute ? `/:${dynamicRoute}` : '';
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

function buildMidFuncs(midFuncs: MidFuncs, pathFromEntryPoint: string = '')
{
    for (const f of midFuncs)
    {
        const {path, name, func, funcs} = f;
        const currentPath = getPathFromEntryPoint(pathFromEntryPoint, path);
        buildMidFunc(`${currentPath}.ts`, name, func, getSubFuncs(funcs ?? [])[0]);
        if (funcs) return buildMidFuncs(funcs, currentPath);
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


function getSubFuncs(midFuncs: MidFuncs): [string[], FuncsInfo]
{
    const importArray: string[] = [];
    const subFuncs: Imports = {};
    const funcsInfo: FuncsInfo = [];

    for (const f of midFuncs)
    {
        const {path, name, func, route} = f;
        if (!subFuncs[path]) subFuncs[path] = [];
        subFuncs[path].push(name);
        const funcInfo: FuncInfo = {
            name: name,
            method: func.method,
            route: route
            };
        const dynamicRoute = func.req?.dynamicRoute;
        if (Array.isArray(dynamicRoute))
        {
            funcInfo['dynamicRoute'] = dynamicRoute[0];
        }
    }
    for (const path in subFuncs)
    {
        importArray.push(`import { ${subFuncs[path].join(', ')} } from "${path}";`);
    }
    return [importArray, funcsInfo];
}

function buildMidFunc(path: string, name: string, midFunc: MidFunc, subFuncImports: string[])
{
    const { req } = midFunc;
    const topLines: string[] = [
        'import { Request, Response, NextFunction } from "express";',
        'import { z } from "zod";',
        ...subFuncImports
    ];
    const funcLines: string[] = [];
    if (req)
    {
        const dynamicRoute = req.dynamicRoute;
        const body = req.body;
        const params = req.params;
        if (dynamicRoute)
        {
            funcLines.push(...getZodLines(req['dynamicRoute'], 'dynamicRoute'));
        }
        else if (params)
        {
            funcLines.push(...getZodLines(req['params'], 'params'));
        }
        if (body)
        {
            funcLines.push(...getZodLines(req['body'], 'body'));
        }
    }
    _write(path, _arrayToString([
        ...topLines,
        '',
        `export async function ${name}(req: Request, res: Response, next: NextFunction) {`,
        ...funcLines,
        '}',
    ]));
}

function getZodLines(data: any, paramType: keyof ReqConfig)
{
    let frontStr = 'z.object({ ';
    let backStr = '})';
    const paramNames: string[] = [];
    if (paramType === 'params' || paramType === 'body')
    {
        for (const key in data)
        {
            paramNames.push(key);
            const param = data[key];
            const required = param['required'];
            const type = param['type'];
            if (required === true)
            {
                frontStr += `${key}: ${convertParamTypeToZodTypeAnyString(type)}, `
            }
            else
            {
                frontStr += `${key}: ${convertParamTypeToZodTypeAnyString(type)}.optional(), `
            }
        }
    }
    else
    {
        const [ paramName, type ] = data;
        paramNames.push(paramName);
        frontStr += `${paramName}: ${convertParamTypeToZodTypeAnyString(type)}, `
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

function convertParamTypeToZodTypeAnyString(type: ParamType, frontStr: string = '', backStr: string = '') {
    if (Array.isArray(type) && type.length === 1) {
        frontStr += 'z.array(';
        backStr += ')';
        return convertParamTypeToZodTypeAnyString(type[0], frontStr, backStr);
    }
    else if (Array.isArray(type) && type.length === 2) {
        const innerType = type[0];
        const valueValidator = type[1];
        if (innerType === 'string')
        {
            const validator = valueValidator as {enum?: string[], regex?: string};
            const regex = validator.regex ? `.regex(${validator.regex})` : '';
            const content = validator.enum ? `z.enum(${JSON.stringify(validator.enum)})${regex}` : `z.string()${regex}`;
            return frontStr + content + backStr;
        }
        else if (innerType === 'number')
        {
            const validator = valueValidator as {min?: number, max?: number};
            const min = validator.min ? `.min(${validator.min})` : '';
            const max = validator.max ? `.max(${validator.max})` : '';
            return frontStr + `z.number()${min}${max}` + backStr;
        }
    }
    else if (typeof type === 'object' && type !== null) {
        frontStr += 'z.object({';
        backStr += '})';
        let innerStr = '';
        for (const key in type) {
            innerStr += `${key}: ${convertParamTypeToZodTypeAnyString(type[key])}, `;
        }
        return frontStr + innerStr.slice(0, -2) + backStr;
    } else {
        if (type == 'string') {
            return frontStr + 'z.string()' + backStr;
        } else if (type == 'number') {
            return frontStr + 'z.number()' + backStr;
        } else {
            return frontStr + 'z.boolean()' + backStr;
        }
    }
}