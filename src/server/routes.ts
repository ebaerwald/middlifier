import { MidConfig, MidFunc, MidFuncs, Routes, InnerRoute } from "..";
import { findMidfuncs } from "./midfunc";

export function buildRoutes(config: MidConfig)
{
    const routes = config.server.routes;
    const funcs = config.server.funcs;
    const funcObj = getFuncInfo(funcs);
    const routeInfo = getRouteObj(routes ?? {}, funcObj);
    console.log(JSON.stringify(routeInfo, null, 2));
}

export function getRouteObj(routes: Routes | InnerRoute, funcObj: FuncObj, routeObj: RouteObj = {}, currentRoute: string = '', lastPath: string = '-', lastKey: string = ''): RouteObj {
    if (Array.isArray(routes)) {
        const [innerRoute, routeDetails] = routes;
        const [path, funcs] = routeDetails;

        if (!routeObj[lastPath]) routeObj[lastPath] = {};
        if (!routeObj[lastPath][currentRoute]) routeObj[lastPath][currentRoute] = [];
        routeObj[lastPath][currentRoute].push([`./${path}`, `${lastKey}Router`]);

        if (funcs) {
            for (const func of funcs) {
                const finalFunc = funcObj[func];
                try {
                    if (finalFunc[0] !== null)
                    {
                        if (!routeObj[path]) routeObj[path] = {};
                        if (!routeObj[path][`/${lastKey}`]) routeObj[path][`/${lastKey}`] = [];
                        routeObj[path][`/${lastKey}`].push(funcObj[func]);
                    }
                }
                catch (e: any) {}
            }
        }
        
        return getRouteObj(innerRoute, funcObj, routeObj, '', path, '');
    } else {
        for (const key in routes) {
            const route = routes[key];
            let updatedCurrentRoute = currentRoute + `/${key}`;
            let updatedLastKey = key;
            routeObj = getRouteObj(route, funcObj, routeObj, updatedCurrentRoute, lastPath, updatedLastKey);
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

type RouteObj = {
    [path: string]: {
        [route: string]: FuncInfo[]
    }
};
