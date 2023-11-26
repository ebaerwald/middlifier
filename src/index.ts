import chalk from "chalk";
import readline from "readline";
import * as url from "url";
import jsonObj from './middlifier.config.json' assert {type: 'json'};
import installBackendDependencies from "./backend/dependencies";
import installMiddlewareDependencies from "./middleware/dependencies";
import buildBackend from "./backend/index";
import buildMiddleware from "./middleware/index";
import createPrompt from "prompt-sync";
import { execSync } from 'child_process';

const input = createPrompt();

export default function main()
{
    console.log(chalk.blue("Welcome to Middlifier! 🎉\n"));
    setTimeout(() => {

        console.log('Current Directory: ' + process.cwd());
        let answer = input('Are you in the root folder? ' + chalk.bold('(y/n) '));
        while (answer.toLowerCase() !== 'y')
        {
            console.log(chalk.redBright.bold('✖ ') + 'Please navigate to the root folder of your project!');
            answer = input('');
            const directory = answer.split(' ')[1];
            try 
            {
                if (typeof directory === 'string') process.chdir(directory);
            }
            catch (err: any)
            {
                console.error(chalk.redBright.bold(err));
            }
            console.log('Current Directory: ' + process.cwd());
            answer = input('Are you at the root folder? ' + chalk.bold('(y/n) '));
        }
        if (jsonObj)
        {
            console.log('');
            answer = input('You have a middlifier.config.json file in your project. Would you like to use it? ' + chalk.bold('(y/n) '));
            if (answer.toLowerCase() === 'y') 
            {
                console.log('\nInstalling backend dependencies...');
                const installedUsefullBackendDependencies = installBackendDependencies(jsonObj);
                console.log(chalk.greenBright.bold('✔ ') + 'Backend dependencies were installed!');
                console.log('\nBuilding backend...');
                buildBackend(installedUsefullBackendDependencies, jsonObj);
                console.log(chalk.greenBright.bold('✔ ') + 'Backend was built!');
                console.log('\nInstalling middleware dependencies...');
                const installedUsefullMiddlewareDependencies = installMiddlewareDependencies(jsonObj);
                console.log(chalk.greenBright.bold('✔ ') + 'Middleware dependencies were installed!');
                console.log('\nBuilding middleware...');   
                buildMiddleware(installedUsefullMiddlewareDependencies, jsonObj); 
                console.log(chalk.greenBright.bold('✔ ') + 'Middleware was built!');
            } 
            else
            {
                const installedUsefullBackendDependencies = installBackendDependencies();
                buildBackend(installedUsefullBackendDependencies);
            }
        }
    }, 500);
}

if (import.meta.url.startsWith('file:')) 
{ 
    const modulePath = url.fileURLToPath(import.meta.url);
    if (process.argv[1] === modulePath) 
    { 
        main();
    }
}