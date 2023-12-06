import chalk from "chalk";
import * as url from "url";
import jsonObj from './middlifier.config.json' assert {type: 'json'};
import buildBackend from "./backend/index";
import buildMiddleware from "./middleware/index";
import { input } from "./helper";

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
        let lang;
        if (jsonObj)
        {
            if (jsonObj.language)
            {
                lang = jsonObj.language;
            }
            else
            {   
                lang = input('Would you like to use TypeScript in your project? ' + chalk.bold('(y/n) ')).toLowerCase() === 'y' ? 'ts' : 'js';
            }

            console.log('');
            answer = input('You have a middlifier.config.json file in your project. Would you like to use it? ' + chalk.bold('(y/n) '));
            if (answer.toLowerCase() === 'y') 
            {
                const backend = jsonObj.backend || null;
                buildBackend(backend, lang);
                const middleware = jsonObj.middleware || null;
                buildMiddleware(middleware, lang);
            } 
            else
            {
                buildBackend(null, lang);
                buildMiddleware(null, lang);
            }
            console.log(chalk.greenBright.bold('✔ ') + 'Middlifier has finished building your project!');
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