import { getObjValue, writeFile, writeLine } from '../../helper';

export function buildIndex(obj: any, installedDep: string, lang: string)
{
  writeFile('index.' + lang, getFileLines(installedDep, obj));
}

function getFileLines(installedDep: string, obj: any): string[]
{
  writeLine(true, `import express from 'express';`);
  writeLine(getObjValue(obj, 'dependencies').includes('cors') || installedDep.includes('cors'), `import cors from 'cors';`);
  writeLine(getObjValue(obj, 'dependencies').includes('body-parser') || installedDep.includes('body-parser'), `import bodyParser from 'body-parser';`);
  writeLine(true, `const server = express();`);
  writeLine(true, ``);
  writeLine(getObjValue(obj, ['express', 'cors']), `server.use(cors());`);
  writeLine(getObjValue(obj, ['express', 'json']), `server.use(express.json(#));`);
  writeLine(getObjValue(obj, ['express', 'urlencoded']), `server.use(express.urlencoded(#));`);
  writeLine(true, ``);
  writeLine(true, `server.listen(${getObjValue(obj, 'port', 8080)}, () => {`);
  writeLine(true, `    console.log('Server is listening on port ${getObjValue(obj, 'port', 8080)}!');`);
  return writeLine(true, `});`);
}