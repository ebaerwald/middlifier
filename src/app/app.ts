import { MidConfig } from "../index";

export function buildApp(config: MidConfig)
{
    const appPath = config.app.path ?? './app';
    process.chdir(appPath);
}