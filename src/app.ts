import { navigateTo } from "./helper.js";
import { MidConfig } from "./index.js";

export function buildApp(config: MidConfig)
{
    const appPath = config.paths?.server ?? './app';
    navigateTo(appPath, 'In app.ts, Line 7');
}