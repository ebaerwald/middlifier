import { MidConfig } from "../index";
import { _setupNode } from "../helper";

export function buildApp(config: MidConfig)
{
    const appPath = config.app.path ?? './app';
    _setupNode([], appPath);
    process.chdir(appPath);
}