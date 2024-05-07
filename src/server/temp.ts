import { PoolConfig } from 'pg';
import { Config } from 'drizzle-kit';
import { rSchema, rServer, MidFuncs, MidFunc, Routes, InnerRoute, ReqConfig } from '..';
import { findMidfuncs } from './midfunc';
// import { getRouteChildren } from './routes';

type Imports = {
    [path: string]: string[];
}

export const drizzleConfigTemp = (config: Config) => {
    return [
        'import type { Config } from "drizzle-kit";',
        '',
        `export default ${JSON.stringify(config, null, 2).replace(/\\/g, '\\\\')} satisfies Config;`,
    ]
}

export const dbConfigTemp = (config: PoolConfig) => {
    return [
        `import { drizzle } from "drizzle-orm/node-postgres";`,
        'import Pool from "pg-pool";',
        '',
        `const pool = new Pool(${JSON.stringify(config, null, 2).replace(/\\/g, '\\\\')});`,
        '',
        'export const db = drizzle(pool);',
    ]
}

export const schemaTemp = (schema: rSchema, name: string) => {
    const imports: string[] = [];
    const schemaLines: string[] = [];
    for (const key in schema)
    {
        if (!imports.includes(schema[key].type))
        {
            imports.push(schema[key].type);
        }
        schemaLines.push(`  ${key}: ${schema[key].type}('${schema[key].name}')${schema[key].primaryKey ? '.primaryKey()': ''},`);
    }
    return [
        `import { pgTable, ${imports.join(', ')} } from "drizzle-orm/pg-core";`,
        '',
        `export const plans = pgTable('${name}', {`,
        schemaLines.join('\n'),
        '});',
    ];
}

export const indexTemp = (server: rServer) => {
    const topLines: string[] = ['import express from "express"'];
    if (server.cors) topLines.push('import cors from "cors"');
    if (server.secrets) topLines.push('import dotenv from "dotenv"', 'dotenv.config()');
    let imports: Imports = {};
    const funcNames = server.indexFuncNames;
    const bottomLines: string[] = [];
    const obj = findMidfuncs(server.funcs, funcNames ?? []);
    const importObj: Imports = {};
    for (const path in obj)
    {
        importObj[path] = obj[path][0];
    }
    imports = {...imports, ...importObj};
    for (const path in importObj)
    {
        const funcs = importObj[path];
        for (const func of funcs)
        {
            bottomLines.push(`app.use(${func});`);
        }
    }
    const routes = server.routes;
    if (routes)
    {
        // for (const key in routes)
        // {
        //     const route = routes[key];
        //     for (const secondKey in route)
        //     {
        //         const secondRoute = route[secondKey];
        //         if (Array.isArray(secondRoute))
        //         {
        //             const path: string = secondRoute[1][0];
        //             if (!imports[path]) imports[path] = [];
        //             imports[path].push(`${secondKey}Route`);
        //             bottomLines.push(`app.use('/${key}', ${secondKey}Route);`);
        //         }
        //     }
        // }
        // const children: RouteObj = getRouteChildren(server.funcs, routes);
        for (const key in routes)
        {

        }
    }
    for (const indexImport in imports)
    {
        const imp = imports[indexImport];
        topLines.push(`import { ${imp.join(', ')} } from "${indexImport}";`)
    }
    if (server.cors) bottomLines.push(`app.use(cors(${JSON.stringify(server.cors, null, 2).replace(/\\/g, '\\\\')}));`);
    if (server.json) bottomLines.push(`app.use(express.json(${JSON.stringify(server.json, null, 2).replace(/\\/g, '\\\\')}));`);
    if (server.urlencoded) bottomLines.push(`app.use(express.urlencoded(${JSON.stringify(server.urlencoded, null, 2).replace(/\\/g, '\\\\')}));`);
    const sets = server.set;
    for (const setKey in sets)
    {
        const set = sets[setKey];
        bottomLines.push(`app.set('${setKey}', ${JSON.stringify(set, null, 2).replace(/\\/g, '\\\\')})`);
    }

    return [
        ...topLines,
        '',
        'const app = express()',
        '',
        ...bottomLines,
        '',
        `app.listen(${server.port}, () => console.log('Server running on port ${server.port}'));`
    ];
};

function buildRoutes(server: rServer): RouteObj
{
    const routeObj: RouteObj = {};
    const funcs = getFuncInfo(server.funcs);
    return routeObj;
}

function getRouteObj(routes: Routes | InnerRoute, funcObj: FuncObj, routeObj: RouteObj = {}, currentRoute: string = '', lastPath: string = '', lastKey: string = '')
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

// function getRouteChildren(route: Routes, currentRoute: string, routeInfo: {[route: string]: FuncInfo} = {}): {[route: string]: FuncInfo}
// {
//     if (Array.isArray(route))
//     {
//         routeInfo[currentRoute]
//     }
//     return routeInfo;
// }

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
// function getRouteChildren(routes: Routes, initialRoute: string, currentRoute: string = '', routesStr: string[] = []): string[]
// {
//     if (!Array.isArray(routes))
//     {
//         for (const routeName in routes)
//         {
//             const route = routes[routeName];
//             currentRoute += `/${routeName}`;
//             return getRouteChildren(route, initialRoute, currentRoute, routesStr);
//         }
//     }
//     else 
//     {
//         routesStr.push(currentRoute);
//     }
//     return routesStr;
// }
 /** information needed:
  *  @param {string} paths of Functions -- every path could contain multiple @param funcs
  *  @param {string | [string, string | null, string | null]} funcs of Functions -- funcname, method, dynamicRoute
  *  @param {string} routes of Functions 
*/ 

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