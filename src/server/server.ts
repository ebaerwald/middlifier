import { MidConfig } from "../index";
import fs from 'fs';
import { _arrayToString, _createDirIfNotExistent, _encode, _write, _setupNode } from "../helper";
import { nodemonTemp, tsconfigTemp, packageTemp } from "../temp";
import { dbConfigTemp, drizzleConfigTemp, schemaTemp, indexTemp } from "./temp";
import { buildMidFuncs } from "./midfunc";
import { buildRoutes } from "./routes";

export function buildServer(config: MidConfig)
{
    const serverPath = config.server.path ?? './server';
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
    
    if (config.server.drizzle) // drizzle config
    {
       _write('drizzle.config.ts', _arrayToString(drizzleConfigTemp(config.server.drizzle.config)));
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
        _write('Dockerfile', _arrayToString(dockerLines));
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
    buildMidFuncs(config);
    const temp = indexTemp(config.server);
    _write('index.ts', _arrayToString(temp[0]));
    buildRoutes(temp[1]);
    _createDirIfNotExistent('./db');
    process.chdir('./db'); 
    if (config.server.drizzle)
    {
        _write('db.ts', _arrayToString(dbConfigTemp(config.server.drizzle?.dbConfig)));
    }
    if (config.server.drizzle?.schemas)
    {
        _createDirIfNotExistent('./schemas');
        process.chdir('./schemas');
        for (const key in config.server.drizzle.schemas)
        {
            _write(`${key}.ts`, _arrayToString(schemaTemp(config.server.drizzle.schemas[key], key)));
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