import { PoolConfig } from 'pg';
import { Config } from 'drizzle-kit';

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