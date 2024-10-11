#!/usr/bin/env node
import { end } from "./index";
const args = process.argv.slice(2);
let app = 'app';
let server = 'server';
let lastArg = '';
for (const arg of args)
{
    if (lastArg == arg) continue;
    if (lastArg == '-a')
    {
        app = arg;
    }
    if (lastArg == '-s')
    {
        server = arg;
    }
    lastArg = arg;
}
end(app, server);