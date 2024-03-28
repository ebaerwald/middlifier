import { MidConfig } from "./index.js";
import { createDirIfNotExistent } from "./helper.js";

export function buildApp(config: MidConfig)
{
    const appPath = config.paths?.server ?? './app';
    createDirIfNotExistent(appPath);
    process.chdir(appPath);
}