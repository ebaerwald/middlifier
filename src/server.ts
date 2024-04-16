import { MidConfig } from "./index";
import fs from 'fs';
import { arrayToString, createDirIfNotExistent, navigateTo } from "./helper";
import { execSync } from 'child_process';

export function buildServer(config: MidConfig)
{
    const serverPath = config.paths?.server ?? './server';
    navigateTo(serverPath, 'In server.ts, Line 9');
    let packageJsonContent = fs.readFileSync('package.json', { encoding: 'utf-8', flag: 'r' });
    let packageJson = JSON.parse(packageJsonContent);
    packageJson.scripts = {};
    if (!packageJson.scripts.build) packageJson.scripts.build = "npx tsc";
    if (!packageJson.scripts.dev) packageJson.scripts.dev = "nodemon src/index.ts"
    if (!packageJson.scripts.start) packageJson.scripts.start = "node dist/index.js";
    packageJsonContent = JSON.stringify(packageJson, null, 2);
    const formattedJson = packageJsonContent.replace(/\\/g, '\\\\');
    fs.writeFileSync('package.json', formattedJson);
    // ---------------------------------------
    // tsconfig.json
    execSync("npx tsc --init");
    let tsconfigContent = fs.readFileSync('tsconfig.json', { encoding: 'utf-8', flag: 'r' });
    tsconfigContent = tsconfigContent.replace('// "outDir": "./"', '"outDir": "./dist"');
    fs.writeFileSync('tsconfig.json', tsconfigContent);
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
            dockerLines.push(`${element[0]} ${element}`);
        }
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
    navigateTo('../..', 'In server.ts, Line 53');
}