import { MidConfig, ServerInfo, PackageManager } from "..";
import { _setupNode, _create, _encode, _arrayToString, _remove } from "../helper";
import { packageTemp, tsconfigTemp, nodemonTemp } from "../temp";
import { drizzleConfigTemp, dbConfigTemp, schemaTemp } from "./temp";
import { buildServerStructure } from "./structure";

export function buildServer(config: MidConfig, packageManager: PackageManager): ServerInfo
{
    const server = config.server;
    const serverPath = server.path ?? './server';   
    _setupNode(["express", "cors", "dotenv", "zod"], serverPath, packageManager, true);
    _create('package.json', {content: _encode({
        ...packageTemp,
        name: 'server',
        scripts: {
            ...packageTemp.scripts,
            'db:generate': "drizzle-kit generate:pg",
            'db:push': "drizzle-kit push:pg"
        }
    })});
    _create('tsconfig.json', {content: _encode(tsconfigTemp)});
    _create('nodemon.json', {content: _encode(nodemonTemp(["./src/index.ts"]))});
    build('drizzle.config.ts', _arrayToString(drizzleConfigTemp(server.drizzle?.config ?? {})), server.drizzle !== undefined);
    build('Dockerfile', _arrayToString((server.docker ?? []).map(element => `${element[0]} ${element[1]}`)), server.docker !== undefined);
    build('.env', _arrayToString(Object.entries(server.secrets ?? {}).map(([key, value]) => `${key}=${value}`)), server.secrets !== undefined);
    _create('./db');
    build('./db/db.ts', _arrayToString(dbConfigTemp(server.drizzle?.db ?? {})), server.drizzle?.db !== undefined);
    _create('./db/schemas');
    if (server.drizzle?.schemas) Object.entries(server.drizzle.schemas).map(([key, value]) => {
        _create(`./db/schemas/${key}.ts`, {content: _arrayToString(schemaTemp(value, key))});
    });
    process.chdir('../..');
    const serverInfo = buildServerStructure(server.express, server.secrets, server.port, server.structure);
    return {}
}

function build(relativePath: string, content: string, condition: boolean)
{
    _create(relativePath, {
        content,
        condition
    });
    _remove(relativePath, !condition);
}
