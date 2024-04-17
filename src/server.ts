import { MidConfig } from "./index";
import fs from 'fs';
import { arrayToString, createDirIfNotExistent, navigateTo } from "./helper";
import { execSync } from 'child_process';

export function buildServer(config: MidConfig)
{
    const serverPath = config.server.path ?? './server';
    navigateTo(serverPath, 'In server.ts, Line 9');
    let packageJsonContent = fs.readFileSync('package.json', { encoding: 'utf-8', flag: 'r' });
    let packageJson = JSON.parse(packageJsonContent);
    packageJson.scripts = {};
    if (!packageJson.scripts.build) packageJson.scripts.build = "npx tsc";
    if (!packageJson.scripts.dev) packageJson.scripts.dev = "nodemon src/index.ts"
    if (!packageJson.scripts.start) packageJson.scripts.start = "node dist/index.js";
    if (!packageJson.scripts['db:generate']) packageJson.scripts['db:generate'] = "drizzle-kit generate:pg";
    if (!packageJson.scripts['db:push']) packageJson.scripts['db:push'] = "drizzle-kit push:pg";
    packageJsonContent = JSON.stringify(packageJson, null, 2);
    const formattedJson = packageJsonContent.replace(/\\/g, '\\\\');
    fs.writeFileSync('package.json', formattedJson);
    // ---------------------------------------
    // tsconfig.json
    execSync("npx tsc --init");
    fs.writeFileSync('tsconfig.json', arrayToString([
        '{',
        '   "compilerOptions": {',
        '       "target": "ES2022",',
        '       "module": "CommonJS",',
        '       "outDir": "./dist",',
        '       "declaration": true,',
        '       "strict": true,',
        '       "esModuleInterop": true,',
        '       "moduleResolution": "Node",',
        '   },',
        '   "include": ["src/**/*"],',
        '   "exclude": ["node_modules", "**/node_modules/*"]',
        '}'
    ]));
    // ---------------------------------------
    // nodemon.json
    fs.writeFileSync('nodemon.json', arrayToString([
        '{',
        '   "ext": "ts",',
        '   "ignore": [".git", "node_modules/**/node_modules", "src/**/*.spec.ts"],',
        '   "execMap": {',
        '       "ts": "node --require ts-node/register"',
        '   },',
        '   "watch": ["src/"]',
        '}'
    ]));
    // ---------------------------------------
    // drizzle.config
    if (config.server?.drizzle)
    {
        const drizzleLines: string[] = [];
        for (const key in config.server?.drizzle)
        {
            const element = config.server.drizzle[key as keyof typeof config.server.drizzle] as any;
            if (typeof element === 'string')
            {
                drizzleLines.push(`    ${key}: "${element}",`);
            }
            else
            {
                drizzleLines.push(`    ${key}: ${JSON.stringify(element)},`);
            }
        }
        fs.writeFileSync('drizzle.config.ts', arrayToString([
            'import type { Config } from "drizzle-kit";',
            'export default {',
            ...drizzleLines,
            '} satisfies Config'
        ]));
    }
    else
    {
        if (fs.existsSync('drizzle.config.ts'))
        {
            fs.unlinkSync('drizzle.config.ts');
        }
    }
    // ---------------------------------------
    // dockerfile
    if (config.server?.docker)
    {
        const dockerLines: string[] = [];
        for (const element of config.server?.docker)
        {
            dockerLines.push(`${element[0]} ${element[1]}`);
        }
        fs.writeFileSync('Dockerfile', arrayToString(dockerLines));
    }
    else
    {
        if (fs.existsSync('Dockerfile'))
        {
            fs.unlinkSync('Dockerfile');
        }
    
    }
    // ---------------------------------------
    createDirIfNotExistent('./src');
    navigateTo('./src', 'In server.ts, Line 52');
    // db
    createDirIfNotExistent('./db');
    navigateTo('./db', 'In server.ts, Line 104');
    fs.writeFileSync('db.ts', arrayToString([
        `import { drizzle } from "drizzle-orm/node-${config.server.db?.type ?? "postgres"}";`,
        'import Pool from "pg-pool";',
        '',
        `const pool = new Pool(${JSON.stringify(config.server.db?.config)});`,
        '',
        'export const db = drizzle(pool);',
    ]));
    if (config.server.db?.schemas)
    {
        createDirIfNotExistent('./schemas');
        navigateTo('./schemas', 'In ser{`ver.ts, Line 110');
        for (const key in config.server.db?.schemas)
        {
            fs.writeFileSync(`${key}.ts`, arrayToString([
                'import { pgTable, serial, text } from "drizzle-orm/pg-core";',
                '',
                `export const ${key} = pgTable("${key}", ${JSON.stringify(config.server.db?.schemas[key])});`
            ]));
        }
        navigateTo('..', 'In server.ts, Line 118');
    }
    else
    {
        if (fs.existsSync('schemas'))
        {
            fs.rmdirSync('schemas', { recursive: true });
        }
    }
    // ---------------------------------------
    navigateTo('../..', 'In server.ts, Line 53');
}