import { exec } from 'child_process';

export default function installBackendDependencies(jsonObj: any)
{
  const backend = jsonObj.backend ? jsonObj.backend : {};
  const commands = [];
  if (backend.express) commands.push('npm install ' + (backend.express == 'global' ? '-g ' : '') + 'express');
  if (backend.nodemon) commands.push('npm install ' + (backend.nodemon == 'global' ? '-g ' : '') + 'nodemon');
  if (backend.cors) commands.push('npm install ' + (backend.cors == 'global' ? '-g ' : '') + 'cors');
  if (backend.bodyParser) commands.push('npm install ' + (backend.bodyParser == 'global' ? '-g ' : '') + 'body-parser');
  
  for (const command of commands) {
      exec(command, (error: any) => {
          if (error) {
            console.error(`Error executing the command: ${error.message}`);
            return;
          }
      });
  }
}






