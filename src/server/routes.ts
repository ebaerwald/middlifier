import { MidConfig, MidFunc, MidFuncs, Routes, InnerRoute } from "..";
import { findMidfuncs } from "./midfunc";

export function buildRoutes(config: MidConfig)
{
    const routes = config.server.routes;
    const funcs = config.server.funcs;
    const funcObj = getFuncInfo(funcs);
    const routeInfo = getRouteObj(routes ?? {}, funcObj);
    console.log(JSON.stringify(routeInfo));
}

function getRouteObj(routes: Routes | InnerRoute, funcObj: FuncObj, routeObj: RouteObj = {}, currentRoute: string = '', lastPath: string = '-', lastKey: string = '')
{
    if (Array.isArray(routes))
    {
        if (!routeObj[lastPath]) routeObj[lastPath] = {};
        if (!routeObj[lastPath][currentRoute]) routeObj[lastPath][currentRoute] = [];
        routeObj[lastPath][currentRoute].push([`${lastKey}Router`, lastPath]);

        const path = routes[1][0];
        const funcs = routes[1][1];
        const cRoute = routes[0];
        if (!routeObj[path]) routeObj[path] = {};
        if (!routeObj[path][`/${lastKey}`]) routeObj[path][`/${lastKey}`] = [];
        if (funcs)
        {
            for (const func of funcs)
            {
                routeObj[path][`/${lastKey}`].push(funcObj[func]);
            }
        }
        return getRouteObj(cRoute, funcObj, routeObj, '', path, '');
    }
    else
    {
        for (const key in routes)
        {
            const route = routes[key];
            currentRoute += `/${key}`;
            lastKey = key;
            return getRouteObj(route, funcObj, routeObj, currentRoute, lastPath, lastKey);
        }
    }
    return routeObj;
}

function getFuncInfo(funcs: MidFuncs)
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

type RouteObj = {
    [path: string]: {
        [route: string]: FuncInfo[]
    }
};
