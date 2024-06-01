import { MidFuncs, Routes, InnerRoute, FinalRouteObj, FinalInnerRoute } from "..";
import { _createDirIfNotExistent, _arrayToString } from "../helper";
import fs from 'fs';
import path from 'path';


export function buildRoutes(routeInfo: FinalRouteObj)
{
    console.log(`Final Route Obj: ${JSON.stringify(routeInfo, null, 2)}`);
    let imports: {[path: string]: string[]} = {};
    for (const cpath in routeInfo)
    {   
        const content = [
            'import { Router } from "express";',
        ];
        const bottomLines: string[] = [''];
        if (cpath === '-') continue;
        const routeName = getRouteName(cpath, routeInfo);
        if (!routeName) throw new Error(`This route file is never been used!: ${path}`);
        bottomLines.push(`export const ${routeName} = Router();`);
        const routes = routeInfo[cpath];
        for (const route in routes)
        {
            const funcs: any = routes[route];   
            for (const func of funcs)
            {
                let [path, funcName, method, dynamicRoute] = func;
                dynamicRoute = dynamicRoute ? `:${dynamicRoute}` : '';
                const relativePath = getRelativePath(cpath, path);
                if (!imports[relativePath]) imports[relativePath] = [];
                imports[relativePath].push(funcName);
                const bottomLine = method ? `${routeName}.route('${route}').${method}(${funcName}${dynamicRoute});` : `${routeName}.use('${route}', ${funcName});`
                bottomLines.push(bottomLine);
            }
        }
        for (const importPath in imports)
        {
            content.push(`import { ${imports[importPath].join(', ')} } from "${importPath}";`);
        }
        content.push(...bottomLines);
        writeRouteFile(cpath, content);
        imports = {};
    }
}

function getRelativePath(startPath: string, endPath: string)
{
    console.log(`startPath: ${startPath}, endPath: ${endPath}`);
    const sPathNormalized = `.${startPath.replace('.', '')}`;
    const ePathNormalized = `.${endPath.replace('.', '')}`;
    console.log(`sPathNormalized: ${sPathNormalized}, ePathNormalized: ${ePathNormalized}`);
    const sPathResolved = path.resolve(sPathNormalized);
    const ePathResolved = path.resolve(ePathNormalized);
    console.log(`sPathResolved: ${sPathResolved}, ePathResolved: ${ePathResolved}`);
    const sPathSplit = sPathNormalized.split(path.sep);
    const ePathSplit = ePathNormalized.split(path.sep);
    let i = 0;
    while (i < sPathSplit.length && i < ePathSplit.length && sPathSplit[i] === ePathSplit[i]) {
        i++;
    }
    const upLevels = sPathSplit.length - i;
    const relativeParts = ['.'.repeat(upLevels), ...ePathSplit.slice(i)];
    const relativePath = relativeParts.join(path.sep);
    console.log(`relativePath: ${relativePath}`);
    return relativePath;
}

function writeRouteFile(path: string, content: string[])
{
    path = path.replace('.', '');
    const pathArr = path.split('/');
    let dir = '.'
    for (let i = 0; i < pathArr.length; i++)
    {
        dir += `/${pathArr[i]}`;
        if (i === pathArr.length - 1)
        {
            const file = `${dir}.ts`;
            fs.writeFileSync(file, _arrayToString(content));
            continue;
        }
        _createDirIfNotExistent(dir);
    }
}

function getRouteName(cpath: string, routeInfo: FinalInnerRoute)
{
    cpath = `.${cpath.replace('.', '')}`;
    for (let path in routeInfo)
    {
        const routes: any = routeInfo[path];
        for (const route in routes)
        {
            const funcs = routes[route];
            for (const func of funcs)
            {
                let [fPath, funcName] = func;
                fPath = `.${fPath.replace('.', '')}`;
                if (fPath === cpath) return funcName;
            }
        }
    }
    return null;
}

export function getRouteObj(routes: Routes, funcObj: FuncObj, routeObj: FinalRouteObj = {}): FinalRouteObj {
    for (const path in routes)
    {
        const route = routes[path];
        if (!routeObj[path]) routeObj[path] = getInnerRoute(route, funcObj);
    }
    return routeObj;
}

function getInnerRoute(innerRoute: InnerRoute, funcObj: FuncObj, routeObj: FinalInnerRoute = {}, cRoute: string = ''): FinalInnerRoute
{
    if (Array.isArray(innerRoute))
    {
        const currentRoute: ([string, string] | [string])[] = innerRoute;
        const funcArr: FuncInfo[] = [];
        for (const func of currentRoute)
        {
            const [funcName, path] = func;
            const finalFunc = funcObj[funcName];
            if (path)
            {
                funcArr.push([path, funcName]);
            }
            else if (finalFunc)
            {
                funcArr.push(finalFunc);
            }
        }
        routeObj[cRoute] = funcArr;
    }
    else
    {
        const currentRoute: any = innerRoute;
        for (const key in currentRoute)
        {
            const routeStr = `${cRoute}/${key}`;
            getInnerRoute(currentRoute[key], funcObj, routeObj, routeStr);
        }
    }
    return routeObj;
}


export function getFuncInfo(funcs: MidFuncs)
{
    const funcObj: {[funcName: string]: FuncInfo} = {};
    for (const path in funcs)
    {
        const firstfunc = funcs[path];
        for (const fileName in firstfunc)
        {
            const secondfunc = firstfunc[fileName];
            for (const funcName in secondfunc)
            {
               const midFunc = secondfunc[funcName];
               if (!funcObj[funcName]) funcObj[funcName] = [`./${path}/${fileName}`, funcName];
               if (midFunc.method) funcObj[funcName].push(midFunc.method);
               if (midFunc.req?.dynamicRoute) funcObj[funcName].push(midFunc.req.dynamicRoute);
            }
        }
    }
    return funcObj;
}

type FuncObj = {
    [funcName: string]: FuncInfo;
}
/**
 * @param {string} funcPath - first
 * @param {string} funcName - second
 * @param {string | undefined} method - third
 * @param {string | undefined} dynamicRoute - fourth
 */
type FuncInfo = [string, string] | [string, string, string] | [string, string, string, string];

export type RouteObj = {
    [path: string]: {
        [route: string]: FuncInfo[]
    }
};
