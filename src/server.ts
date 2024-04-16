import { MidConfig } from "./index";
const fs = require('fs');
import { arrayToString, createDirIfNotExistent, navigateTo } from "./helper";
const { execSync } = require('child_process');

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
    tsconfigContent = tsconfigContent.replace('// "outDir": "./"', '"outdir": "./dist');
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
    console.log("Drizzle config: " + config.drizzle);
    if (config.drizzle)
    {
        const drizzleConfig = JSON.stringify(config.drizzle).split('\n');
        fs.writeFileSync('drizzle.config.ts', arrayToString([
            'import type { Config } from "drizzle-kit";',
            'export default {',
            ...drizzleConfig,
            '} satisfies Config'
        ]));
    }
    // ---------------------------------------
    // dockerfile
    // ---------------------------------------
    createDirIfNotExistent('./src');
    navigateTo('./src', 'In server.ts, Line 52');
    navigateTo('../..', 'In server.ts, Line 53');
}