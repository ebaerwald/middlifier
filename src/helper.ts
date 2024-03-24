import fs from 'fs';
import { execSync } from 'child_process'

export function createDirIfNotExistent(path: string)
{
    if (!fs.existsSync(path))
    {
        fs.mkdirSync(path);
    }
    return path;
}

export function arrayToString(content: string[])
{
    return content.join("\n");
}

export function setupNode(dependencies: string[], path: string | null = null)
{
    if (path)
    {
        createDirIfNotExistent(path);
        process.chdir(path);
    }
    execSync('npm init -y');
    execSync(`npm install ${dependencies.join(' ')}`);
    process.chdir('..');
}