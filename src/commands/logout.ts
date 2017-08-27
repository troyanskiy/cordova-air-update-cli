import * as chalk from 'chalk';

import { ConfigStatus, IConfig } from '../declarations';
import { getConfigStatus, saveConfigApp } from '../utils';
import { HttpRequest } from '../lib/request';

export async function run(config: IConfig) {

  const configStatus = getConfigStatus(config);

  if (configStatus === ConfigStatus.OK) {

    try {
      await HttpRequest.request('/auth/logout', {
        method: 'POST',
      });

      delete config.appConfig.user;
      await saveConfigApp(config);
      console.log(chalk.green('Logout success'));

    } catch (err) {
      console.log(chalk.red('Logout fail'));
    }

  } else {

    console.log(chalk.red('User is not logged in'));

  }

}
