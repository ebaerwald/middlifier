import { MidConfig } from "./index";
import { createDirIfNotExistent, setupNode, arrayToString } from "./helper";
import fs from 'fs';

export function buildApp(config: MidConfig)
{
    const appPath = config.paths?.server ?? './app';
    createDirIfNotExistent(appPath);
    process.chdir(appPath);
}