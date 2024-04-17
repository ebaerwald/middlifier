import { navigateTo } from "./helper";
import { MidConfig } from "./index";

export function buildApp(config: MidConfig)
{
    const appPath = config.app.path ?? './app';
    navigateTo(appPath, 'In app.ts, Line 7');
}