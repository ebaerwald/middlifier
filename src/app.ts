import { navigateTo } from "./helper";
import { MidConfig } from "./index";

export function buildApp(config: MidConfig)
{
    const appPath = config.paths?.server ?? './app';
    navigateTo(appPath, 'In app.ts, Line 7');
}