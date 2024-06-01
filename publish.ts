import { execSync } from 'child_process';
import { _read, _decode, _encode, _write } from './src/helper';

execSync('nvm use node', {stdio: "inherit"});
execSync('bun x tsc', {stdio: "inherit"});
console.log('Building done!');
let packageJsonContent = _read('package.json');
let packageJson = _decode(packageJsonContent);
const versionSplit = packageJson.version.split('.');
packageJson.version = `${versionSplit[0]}.${versionSplit[1]}.${parseInt(versionSplit[2]) + 1}`;
packageJsonContent = _encode(packageJson);
_write('package.json', packageJsonContent);

execSync(`npm publish`, {stdio: "inherit"});
console.log('Published successfully!');
execSync('rm -rf dist', {stdio: "inherit"});