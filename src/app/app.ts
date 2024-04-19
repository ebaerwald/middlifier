import { rMidConfig } from "../index";

export function buildApp(config: rMidConfig)
{
    const appPath = config.app.path ?? './app';
    process.chdir(appPath);
}