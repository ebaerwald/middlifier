import fs from 'fs';
import createPrompt from "prompt-sync";
import chalk from 'chalk';
const input = createPrompt();

export function buildIndex(obj: any, installedDep: string, lang: string)
{
    const fileName = 'index';
    const fileContent = getFileLines(installedDep, obj).join('\n');
    fs.writeFile(fileName + '.' + lang, fileContent, (err) => {
        if (err) {
          console.error(`Error creating file: ${err.message}`);
        } else {
          console.log(`File '${fileName}' created successfully.`);
        }
    });
}

function getFileLines(installedDep: string, obj: any): string[]
{
    console.log(obj);
    const lines: string[] = [];
    lines.push(`import express from 'express';`);
    if (obj.dependencies.includes('cors') || installedDep.includes('cors')) lines.push(`import cors from 'cors';`);
    if (obj.dependencies.includes('body-parser') || installedDep.includes('body-parser')) lines.push(`import bodyParser from 'body-parser';`);
    lines.push(`const server = express();`);
    lines.push(``);
    if (obj.express.cors) lines.push(`server.use(cors());`);
    if (obj.express.json) lines.push(`server.use(express.json());`);
    if (obj.express.urlencoded) lines.push(`server.use(express.urlencoded());`);
    lines.push(``);
    lines.push(`server.listen(${obj.port}, () => {`);
    lines.push(`    console.log('Server is listening on port ${obj.port}!');`);
    lines.push(`});`);
    return lines;
}