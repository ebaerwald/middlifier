import { MidConfig, ParamType, MidFuncs, MidFunc } from "..";
import fs from 'fs';
import { arrayToString } from "../helper";

export type FuncObj = {
    [path: string]: [string[], MidFunc[]]
}

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
                        let zodFrontStr = 'z.object({ ';
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
                                zodFrontStr += `${paramName}: ${convertParamTypeToZodTypeAnyString(paramType)}.optional(), `
                            }
                        }
                        const zodStr = zodFrontStr + zodBackStr;
                        funcLines.push([
                            `   const schema = ${zodStr};`,
                            '   const params: z.infer<typeof schema> = req.params',
                            '   schema.parse(params);',
                            `   const { ${paramNames.join(', ')} } = params;`
                        ]); 
                    }
                    if (reqConfig.body)
                    {
                        const data = reqConfig.body;
                        let zodFrontStr = 'z.object({ ';
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
                                zodFrontStr += `${paramName}: ${convertParamTypeToZodTypeAnyString(paramType)}.optional(), `
                            }
                        }
                        const zodStr = zodFrontStr + zodBackStr;
                        funcLines.push([
                            `   const schema = ${zodStr};`,
                            '   const body: z.infer<typeof schema> = req.body',
                            '   schema.parse(body);',
                            `   const { ${paramNames.join(', ')} } = body;`
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

function convertParamTypeToZodTypeAnyString(type: ParamType, frontStr: string = '', backStr: string = '') {
    if (Array.isArray(type)) {
        frontStr += 'z.array(';
        backStr += ')';
        return convertParamTypeToZodTypeAnyString(type[0], frontStr, backStr);
    } else if (typeof type === 'object' && type !== null) {
        frontStr += 'z.object({';
        backStr += '})';
        let innerStr = '';
        for (const key in type) {
            innerStr += `${key}: ${convertParamTypeToZodTypeAnyString(type[key])}, `;
        }
        return frontStr + innerStr.slice(0, -2) + backStr;
    } else {
        if (type == 'string') {
            return frontStr + 'z.string()' + backStr;
        } else if (type == 'number') {
            return frontStr + 'z.number()' + backStr;
        } else {
            return frontStr + 'z.boolean()' + backStr;
        }
    }
}

export function findMidfuncs(midfuncs: MidFuncs, funcNames: string[]): FuncObj
{
    const funcs: FuncObj = {}
    for (const path in midfuncs)
    {
        const x = midfuncs[path];
        for (const filename in x)
        {
            const y = x[filename];
            for (const funcName in y)
            {
                const mFunc = y[funcName];
                if (funcNames.includes(funcName))
                {
                    if (!funcs[`./${path}/${filename}`]) funcs[`./${path}/${filename}`] = [[], []];
                    funcs[`./${path}/${filename}`][0].push(funcName);
                    funcs[`./${path}/${filename}`][1].push(mFunc);
                }
            }
        }
    }
    return funcs;
}

