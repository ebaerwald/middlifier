import { PoolConfig } from 'pg';
import { Config } from 'drizzle-kit';
import { rSchema, rServer, MidFuncs, MidFunc, Routes, InnerRoute, ReqConfig, FinalRouteObj } from '..';
import { findMidfuncs } from './midfunc';
// import { getRouteChildren } from './routes';
import { getRouteObj, getFuncInfo, RouteObj } from './routes';

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

export const indexTemp = (server: rServer): [string[], FinalRouteObj] => {
    let routeInfo: FinalRouteObj = {};
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
    const funcs = server.funcs;
    if (routes)
    {

        const funcObj = getFuncInfo(funcs);
        routeInfo = getRouteObj(routes, funcObj);
        const indexRoute = routeInfo["-"] ?? {};
        for (const route in indexRoute)
        {
            const midFuncs: any = indexRoute[route];
            for (const funcInfo of midFuncs)
            {
                const path = funcInfo[0];
                const funcName = funcInfo[1];
                const method = funcInfo[2] ?? 'use';
                let dynamicRoute = funcInfo[3] ?? '';
                if (dynamicRoute !== '') dynamicRoute = `:${dynamicRoute}`;
                if (!imports[path]) imports[path] = [];
                imports[path].push(funcName);
                bottomLines.push(`app.${method.toLocaleLowerCase()}("${route}", ${funcName}${dynamicRoute});`);
            }
        }
        // const route = routeInfo["-"];
        // for (const key in route)
        // {
        //     const midFuncs = route[key];
        //     for (const funcInfo of midFuncs)
        //     {
        //         const path = funcInfo[0];
        //         const funcName = funcInfo[1];
        //         const method = funcInfo[2] ?? 'use';
        //         let dynamicRoute = funcInfo[3] ?? '';
        //         if (dynamicRoute !== '') dynamicRoute = `:${dynamicRoute}`;
        //         if (!imports[path]) imports[path] = [];
        //         imports[path].push(funcName);
        //         bottomLines.push(`app.${method.toLocaleLowerCase()}("${key}", ${funcName}${dynamicRoute});`);
        //     }
        // }
        
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

    return [[
        ...topLines,
        '',
        'const app = express()',
        '',
        ...bottomLines,
        '',
        `app.listen(${server.port}, () => console.log('Server running on port ${server.port}'));`
    ], routeInfo
    ];
};