const fs = require('fs');
const { execSync } = require('child_process');

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

export function navigateTo(path: string, where: string)
{
    process.chdir(path);
    console.log(`${where} ${process.cwd()}`);
}

export function setupNode(dependencies: string[], path: string | null = null)
{
    if (path)
    {
        createDirIfNotExistent(path);
        navigateTo(path, 'In helper.ts, Line 29');
    }
    if (!fs.existsSync('package.json'))
    {
        execSync('npm init -y');
    }
    execSync(`npm install ${dependencies.join(' ')}`);
    navigateTo('..', 'In helper.ts, Line 36');
}