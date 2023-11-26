import fs from 'fs';
import createPrompt from "prompt-sync";
import chalk from 'chalk';
const input = createPrompt();

export function buildIndex(aditionalDependencies: string[], backend: any = {})
{
    let fileExtension = backend.language;
    if (!fileExtension)
    {
        fileExtension = input('What language would you like to use for the backend? ' + chalk.bold('(ts/js) '));  
        if (fileExtension.toLowerCase() !== ('ts' || 'js'))
        {
            fileExtension = 'js';
        }
    }
    const fileName = 'index';
    const fileContent = getFileLines(aditionalDependencies, backend).join('\n');
    fs.writeFile(fileName + '.' + fileExtension, fileContent, (err) => {
        if (err) {
          console.error(`Error creating file: ${err.message}`);
        } else {
          console.log(`File '${fileName}' created successfully.`);
        }
    });
}

function getFileLines(aditionalDependencies: string[], backend: any): string[]
{
    console.log(backend);
    const lines: string[] = [];
    lines.push(`import express from 'express';`);
    if (backend.dependencies.includes('cors') || aditionalDependencies.includes('cors')) lines.push(`import cors from 'cors';`);
    if (backend.dependencies.includes('body-parser') || aditionalDependencies.includes('body-parser')) lines.push(`import bodyParser from 'body-parser';`);
    lines.push(`const server = express();`);
    lines.push(``);
    if (backend.express.cors) lines.push(`server.use(cors());`);
    if (backend.express.json) lines.push(`server.use(express.json());`);
    if (backend.express.urlencoded) lines.push(`server.use(express.urlencoded());`);
    lines.push(``);
    lines.push(`server.listen(${backend.port}, () => {`);
    lines.push(`    console.log('Server is listening on port ${backend.port}!');`);
    lines.push(`});`);
    return lines;
}