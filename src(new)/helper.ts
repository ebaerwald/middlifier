import fs from 'fs';
import { execSync } from 'child_process';
import { ZodTypeAny, z } from 'zod';
import { create, StateCreator } from 'zustand';
import { ReqConfig } from '.';
import { Request, Response, NextFunction } from 'express';

export type PackageManager = 'npm' | 'bun';
export type CreateOptions = {
    content?: string,
    replace?: boolean,
    chdir?: boolean,
    condition?: boolean
}

export function _setupNode(dependencies: string[], relativePath: string, packageManager: PackageManager, chdir: boolean = false)
{
    const currentPath = process.cwd();
    _create(relativePath);
    process.chdir(relativePath);
    if (packageManager === 'bun')
    {
        if (!fs.existsSync('package.json'))
        {
            execSync(`bun init -y`, {stdio: "inherit"});
            execSync(`bun add bun-types`, {stdio: "inherit"});
        }
        _remove(['index.ts', 'README.md']);
        execSync(`bun add ${dependencies.join(' ').replace(/ /g, ' ')}`, {stdio: "inherit"});
    }
    else if (packageManager === 'npm')
    {
        if (!fs.existsSync('package.json'))
        {
            execSync(`npm init -y`, {stdio: "inherit"});
        }
        execSync(`npm install ${dependencies.join(' ').replace(/ /g, ' ')}`, {stdio: "inherit"});
    }
    if (!chdir)
    {
        process.chdir(currentPath);
    }
}

export function _create(relativePath: string, options?: CreateOptions)
{
    if (options?.condition === false) return;
    const pathSplit = relativePath.split('/').slice(1);
    let currentPath = '.';
    for (let i = 0; i < pathSplit.length; i++)
    {
        const part = pathSplit[i];
        currentPath += '/' + part;
        if (part.includes('.'))
        {
            if (options?.replace === false) continue;
            fs.writeFileSync(currentPath, options?.content ?? '');
            if (options?.chdir === true)
            {
                process.chdir(currentPath.split('/').slice(0, i - 1).join('/'));
            }
        }
        else
        {
            if (!fs.existsSync(currentPath))
            {
                fs.mkdirSync(currentPath);
            }
            if (i === pathSplit.length - 1 && options?.chdir === true)
            {
                process.chdir(currentPath);
            }
        }
    }
}

export function _remove(paths: fs.PathLike | fs.PathLike[], condition?: boolean)
{
    if (condition === false) return;
    if (Array.isArray(paths))
    {
        for (const path of paths)
        {
            fs.rmSync(path, {recursive: true});
        }
    }
    else 
    {
        fs.rmSync(paths, {recursive: true});
    }
}

export function _isBunInstalled(): boolean {
    try {
      execSync('bun --version', { encoding: 'utf-8' });
      return true;
    } catch (error) {
      return false;
    }
}


// export type InnerFunc = (config: ReqConfig) => (req: Request, res: Response, next: NextFunction) => void;
export function _getInnerFunc(config?: ReqConfig) {
    return z.function().args(
        z.instanceof(Object) as z.ZodType<Request>,
        z.instanceof(Object) as z.ZodType<Response>,
        z.instanceof(Object) as z.ZodType<NextFunction>
    ).returns(z.void());
}

export const _createStore = <T extends ZodTypeAny>(stateSchema: T, stateCreator: StateCreator<z.infer<T>>) => create<z.infer<typeof stateSchema>>(stateCreator);
export const _encode = (content: any) => JSON.stringify(content, null, 2);
export const _decode = (content: string) => JSON.parse(content);
export const _read = (path: string) => fs.readFileSync(path, 'utf-8');
export const _arrayToString = (array: string[]) => array.join('\n');
export const _rename = (firstPath: fs.PathLike, secondPath: fs.PathLike) => fs.renameSync(firstPath, secondPath);


