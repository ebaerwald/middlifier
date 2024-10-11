import fs from 'fs';
import { execSync } from 'child_process';

export type Imports = {
    [path: string]: string[];
}

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

export function _getVarValue(path: string, location: string = "")
{
    let content = _read(path);
    content = content.replace(/\s+/g, '').toString();
    const locations = location.split('.');
    for (const loc of locations)
    {
        let c: string | null = null;
        if (content.includes(`${loc}:`)) {  
            c = splitAtFirstMatch(content, `${loc}:`)[1];
        } 
        else if (content.includes(`"${loc}":`)) {
            c = splitAtFirstMatch(content, `"${loc}":`)[1];
        }
        else if (!isNaN(parseInt(loc))) {
            content = splitAtFirstMatch(content, '[')[1];
            if (Array.from(content)[0] == '{')
            {
                let openBrackets = 0;
                let closedBrackets = 0;
                let finalContent: string = '';
                const chars = content.split('');
                for (const char of chars)
                {
                    finalContent += char;
                    if (char === '{') openBrackets++;
                    else if (char === '}') closedBrackets++;
                    if (openBrackets != 0 && openBrackets == closedBrackets)
                    {   
                        break;
                    }
                }
                content = finalContent;
            }
            else
            {
                content = content.split(',')[0];
            }          
        }
        if (c)
        {
            const firstChar = Array.from(c)[0];
            if (firstChar === '{' || firstChar === '[')
            {
                const lastChar = firstChar === '{' ? '}' : ']';
                let openBrackets = 0;
                let closedBrackets = 0;
                let finalContent: string = '';
                const chars = c.split('');
                for (const char of chars)
                {
                    finalContent += char;
                    if (char === firstChar) openBrackets++;
                    else if (char === lastChar) closedBrackets++;
                    if (openBrackets != 0 && openBrackets == closedBrackets)
                    {   
                        break;
                    }
                }
                content = finalContent;
            }
            else {
                content = c.split('}')[0];
            }
        }
    }
    return content;
}

function splitAtFirstMatch(str: string, delimiter: string) {
    const index = str.indexOf(delimiter);
    if (index === -1) {
      return [str];
    }
    return [str.substring(0, index), str.substring(index + delimiter.length)];
}

export function _splitArrayByKeys<T extends Array<{[keys: string]: any}>>(arr: T, ...keys: (keyof T[0])[][]): (({[keys: string]: any})[])[]
{
   const result: (({[keys: string]: any})[])[] = [];
   for (const key of keys)
   {
        const filteredObj = _filterObjectByKeys(arr, key);
        result.push(filteredObj);
   }
   return result;
}

function _filterObjectByKeys<T extends Array<{[keys: string]: any}>>(arr: 
    T,
    keys: (keyof T[0])[]
)
{
    let result: Array<{[keys: string]: any}> = [];
    for (const a of arr)
    {
        const line: {[keys: string]: any}  = {};
        for (const key of keys as any)
        {
            line[key] = a[key];
        }
        result.push(line);
    }
    return result;
}

export function _replaceMultipleValues(value: string, searchStrs: string | string[], replaceStrs: string | string[])
{
    if (Array.isArray(searchStrs))
    {
        if (Array.isArray(replaceStrs))
        {
            const length = searchStrs.length > replaceStrs.length ? replaceStrs.length : searchStrs.length;
            for (let i = 0; i < length; i++)
            {
                const searchStr = searchStrs[i];
                const replaceStr = replaceStrs[i];
                value.replace(searchStr, replaceStr);
            }
        }
        else
        {
            for (const searchStr of searchStrs)
            {
                value.replace(searchStr, replaceStrs);
            }
        }
    }
    else
    {
        if (Array.isArray(replaceStrs))
        {
            for (const replaceStr of replaceStrs)
            {
                value.replace(searchStrs, replaceStr);
            }
        }
        else
        {
            value.replace(searchStrs, replaceStrs);
        }
    }
    return value;
}


