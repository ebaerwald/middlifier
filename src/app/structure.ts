import { type App } from "../index";
import { type FinalObjs, type FinalObj } from "../server/structure";
import { _arrayToString, _createDirIfNotExistent, _write, Imports } from "../helper";

// absoluteRoute: string,
//     funcPathFromEntryPoint: string,
//     method?: Methods, // method
//     req: ReqConfig, 
//     res?: ResConfig,
//     funcName: string

export function buildAppStructure(app: App, serverInfo: FinalObjs)
{
    let routeNames: {
        [routeName: string]: string[]
    } = {}
    buildClientClass();
    for (const routeName in serverInfo)
    {
        const component = serverInfo[routeName];
        const result = buildComponent(routeName, component);
        routeNames = { ...routeNames, ...result } ;
    }
    buildGeneratedClient(routeNames);
}

function buildClientClass() 
{
    const content = [
        `import { generatedClient } from "./generatedClient";`,
        `import axios, { type AxiosInstance } from 'axios';`,
        ``,
        `export class Client extends generatedClient {`,
        `   constructor(baseURL: string) {`,
        `       const axiosInstance: AxiosInstance = axios.create({`,
        `           baseURL: baseURL`,
        `       });`,
        `       axiosInstance.interceptors.request.use((config) => {`,
        `           const url = new URL(config.url!, baseURL);`,
        "           console.log(`${config.method?.toUpperCase()} ${url} ${JSON.stringify(config.data)}`);",
        `           return config;`,
        `       });`,
        `       axiosInstance.interceptors.response.use((response) => {`,
        "           const logString = `${response.config.method?.toUpperCase()} ${response.config.url} ${response.status} ${JSON.stringify(response.data)}`;",
        `           if (response.status === 200) {`,
        `               console.log(logString);`,
        `           }`,
        `           else`,
        `           {`,
        `               console.error(logString);`,
        `           }`,
        `           return response;`,
        `       }, (error) => {`,
        "           console.error(`${error.config.method?.toUpperCase()} ${error.config.url} ${error.response?.status} ${JSON.stringify(error.response?.data)}`);",
        `           return Promise.reject(error);`,
        `       });`,
        `       super(axiosInstance);`,
        `   }`,
        `}`,
        ``,
        `export const client = new Client('http://localhost:3000');`
    ];
    _write('./client.ts', _arrayToString(content));
}

// info about component
// 
function buildComponent(componentName: string, component: FinalObj[]): {
    [routeName: string]: string[]
}
{
    const routeNames: {
        [routeName: string]: string[]
    } = {
        componentName: []
    };
    const data: string[] = [
        
    ];
        for (const obj of component)
        {
            const { absoluteRoute, funcPathFromEntryPoint, method, req, res, funcName } = obj;
            routeNames.componentName.push(funcName);
            if (res)
            {
                for (const status in res)
                {
                    const resObj = res[status];
                    const { headers, clientConfig } = resObj;               
                }
            }
            const { body, params, dynamicRoute, headers } = req;
        }
    return {};
}

function buildGeneratedClient(routeNames: {
    [routeName: string]: string[]
})
{
    let componentContent: string[] = [];
    let imports: Imports = {};
    const importLines: string[] = [];
    for (const routeName in routeNames)
    {
        let funcLines: string[] = [];
        const funcs = routeNames[routeName];
        for (const func of funcs)
        {
            funcLines.push(`${func}: ${func}(this.axiosInstance);`);
            if (!imports[`./funcs/${routeName}`]) imports[`./funcs/${routeName}`] = [];
            imports[`./funcs/${routeName}`].push(func);
        }
        componentContent = [
            ...componentContent,
            `   public ${routeName} = {`,
            ...funcLines,
            `   }`
        ]
    }
    for (const path in imports)
    {
        importLines.push(`import { ${imports[path].join(', ')} } from "${path}";`);
    }
    const content: string[] = [
        `import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";`,
        ...importLines,
        ``,
        `export class generatedClient {`,
        `   public axiosInstance: AxiosInstance;`,
        `   constructor(axiosInstance?: AxiosInstance) {`,
        `       this.axiosInstance = axiosInstance ?? axios.create();`,
        `   }`,
        ``,
        ...componentContent,
        `}`
    ];
    _write('./generatedClient.ts', _arrayToString(content));
}