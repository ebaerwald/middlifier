import { MidConfig } from "..";
export type Routes = {
    [key: string]: Routes | [
        {
            [key: string]: Routes
        },
        [string] | [string, string] // [path] or [path, funcName]
    ]
};
export type FinalRoutes = {
    [key: string]: Routes
}

export function buildRoutes(config: MidConfig)
{
    const routes = config.server.routes;
    for (const key in routes)
    {
        const route = routes[key];
    }
}

function getRouteChildren(routes: Routes, routePaths: string[] = [], currentRoute = '')
{
    for (const key in routes)
    {
        currentRoute += `/${key}`;
        const route = routes[key];
        if (Array.isArray(route))
        {
            routePaths.push(currentRoute);
        }
    }
}