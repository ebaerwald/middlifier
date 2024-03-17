import { getObjValue, writeFile, writeLines, type LinesStruct, clearLines } from '../../helper';

export function buildDatabase(obj: any, installedDep: string, lang: string)
{
    writeFile('./mongoDB/db.' + lang, getFileLines(installedDep, obj));
    clearLines();
}

function getFileLines(installedDep: string, obj: any): string[]
{
    const lines: LinesStruct = [
        {line: `import mongoose from "mongoose";`},
        {line: ``},
        {line: `const uri = 'mongodb+srv://username:password@cluster.mongodb.net/databasename?retryWrites=true&w=majority';`},
        {line: ``},
        {line: `const connectDB = async () => {`},
        {line: `    try {`},
        {line: `        const conn = await mongoose.connect(uri, {`},
        {line: `            useNewUrlParser: true,`},
        {line: `            useUnifiedTopology: true,`},
        {line: `        });`},
        {line: `        console.log('Connected with MongoDB on ' + conn.connection.host);`},
        {line: `    } catch (err) {`},
        {line: `        console.error(err);`},
        {line: `        process.exit(1);`},
        {line: `    }`},
        {line: `};`},
        {line: ``},
        {line: `module.exports = connectDB;`}
    ];

    return writeLines(lines);
}