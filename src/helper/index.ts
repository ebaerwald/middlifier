import { execSync } from 'child_process';
import chalk from 'chalk';
import createPrompt from "prompt-sync";
const input = createPrompt();

export function installDependencies(usefullDependencies: string[], jsonDependencies: string[] = [])
{
    let dependencieString = '';
    for (const dependencie of jsonDependencies)
    {
        dependencieString += dependencie + ' ';
    }
    let output = execSync('npm install ' + dependencieString, { encoding: 'utf-8' });
    console.log(output);
    dependencieString = '';
    for (const dependencie of usefullDependencies)
    {
        if (!jsonDependencies.includes(dependencie))
        {
            const answer = input('Would you like to use ' + dependencie + '? ' + chalk.bold('(y/n) '));
            if (answer.toLowerCase() === 'y')
            {
                dependencieString += dependencie + ' ';
            }
        }
    }
    output = execSync('npm install ' + dependencieString, { encoding: 'utf-8' });
    console.log(output);
}