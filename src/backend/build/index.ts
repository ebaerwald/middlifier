import { getObjValue, writeFile, writeLines, type LinesStruct, clearLines } from '../../helper';

export function buildIndex(obj: any, installedDep: string, lang: string)
{
  writeFile('index.' + lang, getFileLines(installedDep, obj));
  clearLines();
}

function getFileLines(installedDep: string, obj: any): string[]
{
  const lines: LinesStruct = [
    {line: `import express from 'express';`},
    {line: `import cors from 'cors';`, condition: installedDep.includes('cors'), askLine: true},
    {line: `import bodyParser from 'body-parser';`, condition: installedDep.includes('body-parser'), askLine: true},
    {line: ``},
    {line: `const server = express();`},
    {line: `server.use(cors());`, condition: getObjValue(obj, ['express', 'cors']), askLine: true},
    {line: `server.use(express.json(#));`, replacements: ['#'], condition: getObjValue(obj, ['express', 'json']), askLine: true},
    {line: `server.use(express.urlencoded(#));`, replacements: ['#'], condition: getObjValue(obj, ['express', 'urlencoded']), askLine: true},
    {line: ``},
    {line: `server.listen(${getObjValue(obj, 'port', 8080)}, () => {`},
    {line: `    console.log('Server is listening on port ${getObjValue(obj, 'port', 8080)}!');`},
    {line: `});`}
  ]

  return writeLines(lines);
}