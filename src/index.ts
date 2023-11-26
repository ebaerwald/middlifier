import chalk from "chalk";
import readline from "readline";
import * as url from "url";
import jsonObj from './middlifier.config.json' assert {type: 'json'};
import installBackendDependencies from "./backend/dependencies";

export default function main()
{
    console.log(chalk.blue("Welcome to Middlifier! 🎉\n"));
    setTimeout(() => {
        if (jsonObj)
        {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
              });
              
            rl.question('You have a middlifier.config.json file in your project. Would you like to use it? ' + chalk.bold('(y/n) '), (answer) => {
                if (answer.toLowerCase() === 'y') 
                {
                    console.log('\nInstalling backend dependencies...');
                    installBackendDependencies(jsonObj);
                } 
                else
                {
                //   console.log(chalk.greenBright('\nYou chose not to use the middlifier.config.json file.'));
                } 
                rl.close();
            });
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