import { PoolConfig } from 'pg';
import { Config } from 'drizzle-kit';
import { rSchema } from '..';

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