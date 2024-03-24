import { MidConfig } from "./index";
import { setupNode } from "./helper";

export function buildServer(config: MidConfig)
{
    const serverPath = config.paths?.server ?? './server';
    setupNode([], serverPath);
    process.chdir(serverPath);
}