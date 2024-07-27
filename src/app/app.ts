import { MidConfig } from "../index";
import { _setupNode } from "../helper";
import { type FinalObjs } from "../server/structure";

export function buildApp(config: MidConfig, serverInfo: FinalObjs)
{
    const appPath = config.app.path ?? './app';
    _setupNode([], appPath);
    process.chdir(appPath);
}