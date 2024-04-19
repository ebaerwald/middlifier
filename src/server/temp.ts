import { PoolConfig } from 'pg';
import { Config } from 'drizzle-kit';
import { rSchema, rServer } from '..';

type Paths = {
    [key: string]: string[]
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
    const services = server.services;
    const servicesObj = services?.obj;
    const paths: Paths = {};
    if (servicesObj) 
    {
        for (const key in servicesObj)
        {
            const service = servicesObj[key];
            const handlers = service.handlers;
            const handlersObj = handlers?.obj;
            if (handlersObj)
            {
                for (const handlerKey in handlersObj)
                {
                    const handler = handlersObj[handlerKey];
                    const handlerPath = handler.path ?? handlers.path ?? './';
                    if (!paths[handlerPath]) paths[handlerPath] = [];
                    paths[handlerPath].push(key);
                }
                continue;
            }
            const path: string = service.path ?? services.path ?? './';
            if (!paths[path]) paths[path] = [];
            paths[path].push(key);
        } 
        for (const path in paths)
        {
            const name = paths[path];
            topLines.push(`import { ${name.join(', ')} } from "${path}"`);
        }
    }
    const bottomLines: string[] = [];
    const routes = server.routes;
    if (routes)
    {
        for (const aKey in routes)
        {
            const route = routes[aKey];
            for (const bKey in route)
            {
                topLines.push(`import { ${bKey}Router } from "./routes`);
                bottomLines.push(`app.use("${aKey}", ${bKey}Router)`);
            }
        }
    }
    if (server.cors) bottomLines.push(`app.use(cors(${JSON.stringify(server.cors, null, 2).replace(/\\/g, '\\\\')}));`);
    if (server.json) bottomLines.push(`app.use(express.json(${JSON.stringify(server.json, null, 2).replace(/\\/g, '\\\\')}));`);
    if (server.urlencoded) bottomLines.push(`app.use(express.urlencoded(${JSON.stringify(server.urlencoded, null, 2).replace(/\\/g, '\\\\')}));`);
    for (const p in paths)
    {
        const sPath = paths[p];
        for (const s of sPath)
        {
            bottomLines.push(`app.use(${s})`);
        }
    }
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

