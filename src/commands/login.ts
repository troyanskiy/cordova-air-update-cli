import * as chalk from 'chalk';

import { ConfigStatus, IConfig } from '../declarations';
import { checkConfig, getConfigStatus } from '../utils';

export async function run(config: IConfig) {

  let status = getConfigStatus(config);

  if (status === ConfigStatus.OK) {
    console.log('User is already logged in');
    process.exit(0);
  }

  status = await checkConfig(config, 'login');

  if (status === ConfigStatus.OK) {
    console.log(chalk.green('Login success'));
  } else {
    console.log(chalk.red('Login fail'));
  }

}
