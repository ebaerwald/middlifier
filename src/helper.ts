import createPrompt from "prompt-sync";
import { execSync } from 'child_process';
import fs from "fs";
import chalk from "chalk";
const prompt = createPrompt();

type Dependencies = string[] | null;

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