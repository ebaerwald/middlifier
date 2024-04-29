import { MidConfig } from "../index";
import fs from 'fs';
import { arrayToString, createDirIfNotExistent } from "../helper";
import { nodemonTemp, tsconfigTemp, packageTemp } from "../temp";
import { dbConfigTemp, drizzleConfigTemp, schemaTemp, indexTemp } from "./temp";
import { buildMidFuncs } from "./midfunc";
import { buildRoutes } from "./routes";

export function buildServer(config: MidConfig)
{
    const serverPath = config.server.path ?? './server';
    process.chdir(serverPath);
    fs.writeFileSync('package.json', JSON.stringify({
        ...packageTemp,
        name: 'server',
        scripts: {
            ...packageTemp.scripts,
            'db:generate': "drizzle-kit generate:pg",
            'db:push': "drizzle-kit push:pg"
        }
    }, null, 2).replace(/\\/g, '\\\\'));
    fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfigTemp, null, 2).replace(/\\/g, '\\\\'));
    fs.writeFileSync('nodemon.json', JSON.stringify(nodemonTemp, null, 2).replace(/\\/g, '\\\\'));
    
    if (config.server.drizzle) // drizzle config
    {
       fs.writeFileSync('drizzle.config.ts', arrayToString(drizzleConfigTemp(config.server.drizzle.config)));
    }
    else
    {
        if (fs.existsSync('drizzle.config.ts'))
        {
            fs.unlinkSync('drizzle.config.ts');
        }
    }
    if (config.server.docker)
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
    if (config.server.secrets)
    {
        const envLines: string[] = [];
        for (const key in config.server.secrets)
        {
            envLines.push(`${key}=${config.server.secrets[key]}`);
        }
        fs.writeFileSync('.env', arrayToString(envLines));
    }
    else
    {
        if (fs.existsSync('.env'))
        {
            fs.unlinkSync('.env');
        }
    }
    createDirIfNotExistent('./src');
    process.chdir('./src');
    buildMidFuncs(config);
    buildRoutes(config);
    fs.writeFileSync('index.ts', arrayToString(indexTemp(config.server)));
    createDirIfNotExistent('./db');
    process.chdir('./db'); 
    if (config.server.drizzle)
    {
        fs.writeFileSync('db.ts', arrayToString(dbConfigTemp(config.server.drizzle?.dbConfig)));
    }
    if (config.server.drizzle?.schemas)
    {
        createDirIfNotExistent('./schemas');
        process.chdir('./schemas');
        for (const key in config.server.drizzle.schemas)
        {
            fs.writeFileSync(`${key}.ts`, arrayToString(schemaTemp(config.server.drizzle.schemas[key], key)));
        }
        process.chdir('..');
    }
    else
    {
        if (fs.existsSync('schemas'))
        {
            fs.rmdirSync('schemas', { recursive: true });
        }
    }
    process.chdir('../../..');
}