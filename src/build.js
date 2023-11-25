import fs from 'fs';
import path from 'path';
import readline from 'readline';

function getAllPossibleImports(folderPath)
{
    const innerFunc = (fPath, imports = []) => {
        let fileImports = [
            ...imports,
        ];
        if (fPath.includes('\\'))
        {
            fPath = './' + fPath.replace('\\', '/');
        }
        const files = fs.readdirSync(fPath);
        for (const file of files)
        {
            const filePath = path.join(fPath, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory())
            {
                fileImports = innerFunc(filePath, fileImports);   
            }
            else if (path.extname(filePath) === '.ts')
            {
                const fileName = (path.basename(filePath)).split('.')[0];
                if (fPath.split('/').length == 2)
                {
                    if (fileName !== 'index' && fileName !== 'bin') fileImports.push(fPath.replace(folderPath, '.') + '/' + fileName);
                }
                else
                {
                    fileImports.push(fPath.replace(folderPath, '.') + '/' + fileName);
                } 
            }
        }
        return fileImports;
    };
    return innerFunc(folderPath);
}

async function iterateFiles(folderPath, imports)
{
    const files = fs.readdirSync(folderPath);
    for (const file of files)
    {
        const filePath = path.join(folderPath, file);
        if (path.extname(filePath) === '.js')
        {
            await updateImports(filePath, imports);
        }
    }
}

async function updateImports(filePath, imports)
{
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    for await (const line of rl)
    {
        for (const imp of imports)
        {
            const lineSplit = line.split(' ');
            const lastElement = lineSplit[lineSplit.length - 1];
            if (lastElement.includes(imp) && !lastElement.includes('.js'))
            {
                const newLine = line.replace(imp, imp + '.js');
                fs.writeFileSync(filePath, fs.readFileSync(filePath).toString().replace(line, newLine));
            }
        }
    }
}

const imports = getAllPossibleImports('./src');
console.log(imports);
iterateFiles('./dist', imports);