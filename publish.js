const { execSync } = require('child_process');
const fs = require('fs');

console.log('Building done!');
let packageJsonContent = fs.readFileSync('package.json', { encoding: 'utf-8', flag: 'r' });
let packageJson = JSON.parse(packageJsonContent);
const versionSplit = packageJson.version.split('.');
packageJson.version = `${versionSplit[0]}.${versionSplit[1]}.${parseInt(versionSplit[2]) + 1}`;
packageJsonContent = JSON.stringify(packageJson, null, 2);
const formattedJson = packageJsonContent.replace(/\\/g, '\\\\');
fs.writeFileSync('package.json', formattedJson);

execSync('npm publish', { stdio: 'inherit' });
console.log('Published successfully!');