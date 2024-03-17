import createPrompt from "prompt-sync";
import { execSync } from 'child_process';
import fs from "fs";
import chalk from "chalk";
const prompt = createPrompt();
const lines: string[] = [];

type Dependencies = string[] | null;
type ObjKey = string | string[];
export type LinesStruct = {
    line: string,
    replacements?: string[],
    condition?: boolean,
    askLine?: boolean
  }[]

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
    
    const anser = input(`Would you like to install any other dependencies for the backend? ` + chalk.bold('(y/n) '));
    if (anser.toLowerCase() === 'y')
    {
        let dependency = input(`Which dependency would you like to install? `);
        while (dependency)
        {
            dependencies += dependency + ' ';
            dependency = input(`Which dependency would you like to install? `);
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

export function writeLines(pLines: LinesStruct)
{
    for (const line of pLines)
    {
        writeLine(line.line, getObjValue(line, 'replacements', []), getObjValue(line, 'condition', true), getObjValue(line, 'askLine', false));
    }
    return lines;
}

export function writeLine(line: string, signs: string[], condition = true, askLine = false)
{
    if (condition)
    {
        if (askLine ? askForLine(line) : true)
        {
            for (const sign of signs)
            {
                const input = askForReplacement(line, sign) || '';
                line = line.replace(sign, input);
                console.log(line);
            }
            lines.push(line);
        }
    }
    return lines;
}

export function askForLine(line: string)
{
    if (input(`Would you like to use this line? "${line}" (y/n)`) == 'y')
    {
        return true;
    }
    return false;
}

export function askForReplacement(line: string, sign: string)
{
    if (input(`Would you like to replace the ${sign} in this line? "${line}" (y/n)`) == 'y')
    {
        return input(`With what would you like to replace the ${sign} in this line? "${line}"`);
    }
    return false;
}

export function pushLine(value: any)
{
    if (value) lines.push(value);
    return lines;
}

export function clearLines()
{
    lines.length = 0;
}

