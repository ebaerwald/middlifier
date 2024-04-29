import { PoolConfig } from 'pg';
import { Config } from 'drizzle-kit';
import { rSchema, rServer, MidFuncs, MidFunc } from '..';

type Imports = {
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
    let imports: Imports = {};
    const funcNames = server.indexFuncNames;
    const bottomLines: string[] = [];
    const obj = findMidfuncs(server.funcs, funcNames ?? []);
    imports = {...imports, ...obj};
    for (const path in obj)
    {
        const funcs = obj[path];
        for (const func of funcs)
        {
            bottomLines.push(`app.use(${func});`);
        }
    }
    const routes = server.routes;
    if (routes)
    {
        for (const key in routes)
        {
            const route = routes[key];
            for (const secondKey in route)
            {
                const secondRoute = route[secondKey];
                if (Array.isArray(secondRoute))
                {
                    const path: string = secondRoute[1][0];
                    if (!imports[path]) imports[path] = [];
                    imports[path].push(`${secondKey}Route`);
                    bottomLines.push(`app.use('/${key}', ${secondKey}Route);`);
                }
            }
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

export function findMidfuncs(midfuncs: MidFuncs, funcNames: string[]): Imports
{
    const funcs: Imports = {}
    for (const path in midfuncs)
    {
        const x = midfuncs[path];
        for (const name in x)
        {
            const y = x[name];
            for (const func in y)
            {
                if (funcNames.includes(func))
                {
                    if (!funcs[`./${path}/${name}`]) funcs[`./${path}/${name}`] = [];
                    funcs[`./${path}/${name}`].push(func);
                }
            }
        }
    }
    return funcs;
}

