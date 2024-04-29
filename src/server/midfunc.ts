import { MidConfig, ParamType } from "..";
import fs from 'fs';
import { arrayToString } from "../helper";
import { z, ZodTypeAny } from "zod";

export function buildMidFuncs(config: MidConfig)
{
    const midfuncs = config.server.funcs;
    const funcLines = [];
    for (const path in midfuncs)
    {
        const x = midfuncs[path];
        for (const name in x)
        {
            const y = x[name];
            for (const func in y)
            {
                const z = y[func];
                const reqConfig = z.req;
                if (reqConfig)
                {
                    if (reqConfig.dynamicRoute)
                    {
                        funcLines.push(`    const ${name} = req.params.${reqConfig.dynamicRoute};`);
                    }
                    else if (reqConfig.params)
                    {
                        const data = reqConfig.params;
                        let zodFrontStr = 'z.object({';
                        let zodBackStr = '})';
                        const paramNames: string[] = []
                        for (const paramName in data)
                        {
                            paramNames.push(paramName);
                            const param = data[paramName];
                            const paramType = param['type'];
                            if (param.required === true)
                            {
                                zodFrontStr += `${paramName}: ${convertParamTypeToZodTypeAnyString(paramType)}, `
                            }
                            else
                            {
                                zodFrontStr += `${paramName}: z.union(${convertParamTypeToZodTypeAnyString(paramType)}, z.undefined())`
                            }
                        }
                        const zodStr = zodFrontStr + zodBackStr;
                        funcLines.push([
                            'const params = req.params',
                            `const { ${paramNames.join(', ')} } = params;`,
                            `const schema = ${zodStr};`,
                            'schema.parse(params);'
                        ]); 
                    }
                    if (reqConfig.body)
                    {
                        const data = reqConfig.body;
                        let zodFrontStr = 'z.object({';
                        let zodBackStr = '})';
                        const paramNames: string[] = []
                        for (const paramName in data)
                        {
                            paramNames.push(paramName);
                            const param = data[paramName];
                            const paramType = param['type'];
                            if (param.required === true)
                            {
                                zodFrontStr += `${paramName}: ${convertParamTypeToZodTypeAnyString(paramType)}, `
                            }
                            else
                            {
                                zodFrontStr += `${paramName}: z.union(${convertParamTypeToZodTypeAnyString(paramType)}, z.undefined())`
                            }
                        }
                        const zodStr = zodFrontStr + zodBackStr;
                        funcLines.push([
                            '   const body = req.body',
                            `   const { ${paramNames.join(', ')} } = body;`,
                            `   const schema = ${zodStr};`,
                            '   schema.parse(body);'
                        ]); 
                    }
                }
                if (!fs.existsSync(`./${path}`)) fs.mkdirSync(`./${path}`);
                fs.writeFileSync(`./${path}/${name}.ts`, arrayToString([
                    'import { Request, Response, NextFunction } from "express";',
                    'import { z } from "zod"',
                    '',
                    `export async function ${func}(req: Request, res: Response, next: NextFunction) {`,
                    ...funcLines.flat(),
                    '}'
                ]));
            }
        }
    }
}

function convertParamTypeToZodTypeAnyString(type: ParamType, frontStr: string = '', backStr: string = '')
{
    if (Array.isArray(type))
    {
        frontStr += 'z.array(';
        backStr += ')';
        convertParamTypeToZodTypeAnyString(type[0], frontStr, backStr);
    }
    else if (typeof type === 'object' && !Array.isArray(type) && type !== null)
    {
        frontStr += 'z.object({';
        backStr += '})';
        for (const key in type)
        {
            frontStr += `${key}: ${convertParamTypeToZodTypeAnyString(type[key], frontStr, backStr)}`
        }
    }
    else
    {
        if (type == 'string')
        {
            frontStr += 'z.string()';
        }
        else if (type == 'number')
        {
            frontStr += 'z.number()';
        }
        else
        {
            frontStr += 'z.boolean()';
        }
    }
    return `${frontStr}${backStr}`;
}
