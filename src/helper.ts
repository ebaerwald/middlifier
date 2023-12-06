import createPrompt from "prompt-sync";
import { execSync } from 'child_process';
import fs from "fs";
import chalk from "chalk";
const prompt = createPrompt();
const lines: string[] = [];

type Dependencies = string[] | null;
type ObjKey = string | string[];

export function input(message: string): string
{
    return prompt(message);
}

export function pathExists(path: string)
{
    return fs.existsSync(path);
}

export function execute(command: string)
{
    return execSync(command, { encoding: 'utf-8' });
}

export function getObjValue(obj: any, key: ObjKey, returnValue: any = null)
{
    try 
    {
        if (typeof key === 'string') return obj[key] || returnValue;
        else 
        {
            let currentObj = obj;
            for (const k of key)
            {
                currentObj = currentObj[k];
            }
            return currentObj || returnValue;
        }
    }
    catch (error: any)
    {
        return returnValue;
    }
}

export function installDependencies(dep: Dependencies, mandatoryDep: string[], recommendedDep: string[])
{
    console.log('\nInstalling dependencies...');
    let dependencies = '';
    if (dep)
    {
        for (const dependency of dep)
        {
            dependencies += dependency + ' ';
        }
    }
    for (const dependency of mandatoryDep)
    {
        if (!dependencies.includes(dependency)) dependencies += dependency + ' ';
    }
    for (const dependency of recommendedDep)
    {
        if (!dependencies.includes(dependency))
        {
            const answer = input(`Would you like to install ${dependency}? ` + chalk.bold('(y/n) '));
            if (answer.toLowerCase() === 'y') dependencies += dependency + ' ';
        }
    }
    const output = execute(`npm install ${dependencies}`);
    console.log(output);
    return dependencies;
}

export function writeFile(fileName: string, lines: string[])
{
    fs.writeFile(fileName, lines.join('\n'), (err) => {
        if (err) {
          console.error(`Error creating file: ${err.message}`);
        }
    });
}

export function writeLine(value: any, content: string, asking: boolean = false)
{
    if (value)
    {
        content = content.replace('#', value || '');
        pushLine(content);
        return lines;
    }
    else if (asking)
    {
        if (content.includes('#'))
        {
            if (input('Would you like to replace the # with an own value? ' + chalk.bold('(y/n) ')).toLowerCase() === 'y') 
            {
                const newValue = input('Please enter the value: ');
                content = content.replace('#', newValue);
            }
        }
        if (input('Would you like to add ' + content + '? ' + chalk.bold('(y/n) ')).toLowerCase() === 'y') pushLine(content); return lines;
    }
    return lines;
}

export function pushLine(value: any)
{
    if (value) lines.push(value);
}

export function clearLines()
{
    lines.length = 0;
}

