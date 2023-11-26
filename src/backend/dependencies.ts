import { installDependencies } from '../helper/index';

export default function installBackendDependencies(jsonObj: any = {})
{
  const backendDependencies = jsonObj.backend.dependencies ? jsonObj.backend.dependencies : [];
  installDependencies(["cors", "nodemon", "body-parser", "mongoose"], backendDependencies);
}






