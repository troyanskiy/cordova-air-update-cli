import * as chalk from 'chalk';

import { CommandCrud, IConfig } from '../declarations';
import { createAppOnServer, defCRUDCommand, question, saveConfigApp } from '../utils';

export async function run(config: IConfig) {

  const command = await defCRUDCommand(config);

  switch (command) {

    case CommandCrud.Add:
      return add(config);

    case CommandCrud.Remove:
      return remove(config);

    case CommandCrud.List:
      return list(config);

    case CommandCrud.Help:
      return help(config);

    default:
      return;

  }


}

async function add(config: IConfig) {

  if (config.appConfig.id) {

    console.log(chalk.green('App is already created'));

  } else {

    try {

      const appName = await question({
        text: `Enter you app name (${chalk.gray(config.appConfig.appCode)}): `,
        def: <string>config.appConfig.appCode
      });

      config.appConfig.appName = appName;

      await createAppOnServer(config);

      await saveConfigApp(config);
      console.log(`App ${chalk.green(appName)} has been created with ${chalk.green(<string>config.appConfig.id)}`);

    } catch (err) {

      console.log(chalk.red('App creation on server error'));
      console.log(err);
      process.exit(1);

      return;

    }

  }

  console.log(`You can run command ${chalk.grey('cau platform add <platform>')} to add new platform`);

}

async function remove(config: IConfig) {
  // todo
  console.log(chalk.red('TODO'));
}

async function list(config: IConfig) {
  // todo
  console.log(chalk.red('TODO'));
}

async function help(config: IConfig) {
  // todo
  console.log(chalk.red('TODO'));
}



