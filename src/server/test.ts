import { FinalRouteObj } from '..';
import { _createDirIfNotExistent } from '../helper';
import { FuncObj } from './midfunc';

export function buildUnitTests(routeInfo: FinalRouteObj, funcObj: FuncObj)
{
    _createDirIfNotExistent('./tests')
    for (const path in routeInfo)
    {
        const routes = routeInfo[path];
        for (const route in routes)
        {
            const funcs: any = routes[route];   
            for (const func of funcs)
            {
                let [path, funcName, method] = func;
                if (method)
                {

                }
            }
        }
    }
}