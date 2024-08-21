import { MidConfig } from "../index";
import { _setupNode } from "../helper";
import { type FinalObjs } from "../server/structure";
import { _write, _encode, _createDirIfNotExistent } from "../helper";
import { packageTemp, tsconfigTemp, nodemonTemp } from "../temp";
import fs from 'fs';
import { buildAppStructure } from "./structure";

export function buildApp(config: MidConfig, serverInfo: FinalObjs)
{
    const appPath = config.app.path ?? './app';
    _setupNode(["axios"], appPath);
    process.chdir(appPath);
    if (!fs.existsSync('./package.json'))
    {
        _write('package.json', _encode({
            ...packageTemp,
            name: 'app',
        }));
    }
    if (!fs.existsSync('./tsconfig.json')) _write('tsconfig.json', _encode(tsconfigTemp));
    if (!fs.existsSync('nodemon.json')) _write('nodemon.json', _encode(nodemonTemp(["./src/index.ts"])));
    _createDirIfNotExistent('./middleware');
    process.chdir('./middleware');
    buildAppStructure(config.app, serverInfo);
}
