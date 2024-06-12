import fs from 'fs';
import { execSync } from 'child_process';

export function _createDirIfNotExistent(path: string)
{
    if (!fs.existsSync(path))
    {
        fs.mkdirSync(path);
    }
    return path;
}

export function _arrayToString(content: string[])
{
    return content.join("\n");
}

export function _setupNode(dependencies: string[], path: string | null = null)
{
    if (path)
    {
        _createDirIfNotExistent(path);
        process.chdir(path);
    }
    if (!fs.existsSync('package.json'))
    {
        execSync(`bun init -y`, {stdio: "inherit"});
        execSync(`bun add bun-types`, {stdio: "inherit"});
    }
    _remove(['index.ts', 'README.md']);
    execSync(`bun add ${dependencies.join(' ').replace(/ /g, ' ')}`, {stdio: "inherit"});
    process.chdir('..');
}

export function _encode(content: any, replace: boolean = true)
{
    if (replace)
    {
        return JSON.stringify(content, null, 2).replace(/\\/g, '\\\\');
    }
    else
    {
        return JSON.stringify(content, null, 2)
    }
}

export function _decode(content: any)
{
    return JSON.parse(content);
}

export function _write(path: string, content: string)
{
    try {
        const pathSplit = path.split('/');
        let currentPath = '.'; 
        for (let i = 1; i < pathSplit.length - 1; i++)
        {
            const path = pathSplit[i];
            currentPath += `/${path}`;
            if (!fs.existsSync(currentPath))
            {
                fs.mkdirSync(currentPath);
            }
        }
        fs.writeFileSync(path, content);
        return true;
    }
    catch (error: any) {
        console.log(error.message);
        return false;
    }
}

export function _read(path: string, options: {
    encoding: BufferEncoding;
    flag?: string | undefined;
} | BufferEncoding = { encoding: 'utf-8', flag: 'r' })
{
    try {
        return fs.readFileSync(path, options);
    }
    catch(error: any) {
        console.log(error.message);
        return '';
    }
}

export function _rename(firstPath: fs.PathLike, secondPath: fs.PathLike)
{
    try {
        fs.renameSync(firstPath, secondPath);
        return true;
    }
    catch (error: any) {
        console.log(error.message);
        return false;
    }
}

export function _remove(paths: fs.PathLike | fs.PathLike[])
{
    try {
        if (Array.isArray(paths))
        {
            for (const path of paths)
            {
                fs.rmSync(path, {recursive: true});
            }
            return true;
        }
        fs.rmSync(paths, {recursive: true});
        return true;
    }
    catch (error: any) {
        console.log(error.message);
        return false;
    }
}