import * as chalk from 'chalk';

import { IConfig } from '../declarations';
import { checkConfig, prettyJSON, question } from '../utils';


export async function run(config: IConfig) {
  if (config.appConfig) {
    console.log(chalk.green('cordova-air-update is already initialized for the project'));

    return;
  }

  console.log(chalk.green('Initializing new cordova-air-update'));

  const appCode = await question({
    text: `Enter your app name (${chalk.grey(config.appPackage.name)}): `,
    def: config.appPackage.name
  });

  if (!appCode) {
    console.log(chalk.red('App name is empty'));
    process.exit(1);
  }

  const rexp = /^[0-9a-zA-Z_-]+$/;
  if (!rexp.test(appCode)) {
    console.log(chalk.red('App name should alphanumeric'));
    process.exit(1);
  }

  // let codeSignSecret = await question({
  //   text: `Enter code signature (${chalk.grey('Leave empty to generate random secret')}): `,
  //   def: ''
  // });
  //
  // if (!codeSignSecret) {
  //   codeSignSecret = generateRandomString();
  // }

  config.appConfig = { appCode };

  await checkConfig(config);

  console.log(prettyJSON(config.appConfig));
  console.log(chalk.green('cau.config.json has been created'));

}
