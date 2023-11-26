import { installDependencies } from '../helper/index';

export default function installMiddlewareDependencies(jsonObj: any = {})
{
  const backendDependencies = jsonObj.middleware.dependencies ? jsonObj.middleware.dependencies : [];
  installDependencies(["axios"], backendDependencies);
}
