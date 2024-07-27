import { MidConfig } from "../index";
import fs from 'fs';
import { _arrayToString, _createDirIfNotExistent, _encode, _write, _setupNode } from "../helper";
import { nodemonTemp, tsconfigTemp, packageTemp } from "../temp";
import { dbConfigTemp, drizzleConfigTemp, schemaTemp } from "./temp";
import { buildServerStructure } from "./structure";

export function buildServer(config: MidConfig)
{
    const server = config.server;
    const serverPath = server.path ?? './server';
    _setupNode(["express", "cors", "dotenv", "zod"], serverPath);
    process.chdir(serverPath);
    _write('package.json', _encode({
        ...packageTemp,
        name: 'server',
        scripts: {
            ...packageTemp.scripts,
            'db:generate': "drizzle-kit generate:pg",
            'db:push': "drizzle-kit push:pg"
        }
    }));
    _write('tsconfig.json', _encode(tsconfigTemp));
    _write('nodemon.json', _encode(nodemonTemp(["./src/index.ts"])));
    
    if (server.drizzle) // drizzle config
    {
       _write('drizzle.config.ts', _arrayToString(drizzleConfigTemp(server.drizzle.config)));
    }
    else
    {
        if (fs.existsSync('drizzle.config.ts'))
        {
            fs.unlinkSync('drizzle.config.ts');
        }
    }
    if (server.docker)
    {
        const dockerLines: string[] = [];
        for (const element of server?.docker)
        {
            dockerLines.push(`${element[0]} ${element[1]}`);
        }
        _write('Dockerfile', _arrayToString(dockerLines));
    }
    else
    {
        if (fs.existsSync('Dockerfile'))
        {
            fs.unlinkSync('Dockerfile');
        }
    
    }
    if (server.secrets)
    {
        const envLines: string[] = [];
        for (const key in server.secrets)
        {
            envLines.push(`${key}=${server.secrets[key]}`);
        }
        _write('.env', _arrayToString(envLines));
    }
    else
    {
        if (fs.existsSync('.env'))
        {
            fs.unlinkSync('.env');
        }
    }
    _createDirIfNotExistent('./src');
    process.chdir('./src');
    const serverInfo = buildServerStructure(server);
    
    _createDirIfNotExistent('./db');
    process.chdir('./db'); 
    if (server.drizzle)
    {
        _write('db.ts', _arrayToString(dbConfigTemp(server.drizzle?.dbConfig)));
    }
    if (server.drizzle?.schemas)
    {
        _createDirIfNotExistent('./schemas');
        process.chdir('./schemas');
        for (const key in server.drizzle.schemas)
        {
            _write(`${key}.ts`, _arrayToString(schemaTemp(server.drizzle.schemas[key], key)));
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
    return serverInfo;
}