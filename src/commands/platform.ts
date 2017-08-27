import * as chalk from 'chalk';

import { CommandCrud, IConfig } from '../declarations';
import { createAppChannel, defCRUDCommand, questionYesNo, saveConfigApp, testPlatform } from '../utils';

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

  const platformName = <string>testPlatform(config.argv[0]);
  if (!platformName) {
    console.log(chalk.red('Platform name is missing or wrong'));
    console.log(`Ex: ${chalk.grey('cau platform add <platform>')}`);

    return;
  }

  const appConfig = config.appConfig;

  if (!appConfig.id) {
    console.log(chalk.red('App does not exists'));
    console.log(`Run command ${chalk.grey('cau app add')} to add an App`);

    return;
  }

  const platformExists = appConfig.platforms && appConfig.platforms[platformName];


  if (platformExists) {

    console.log(chalk.red(`Platform ${platformName} is already added`));

  } else {

    appConfig.platforms = appConfig.platforms || {};
    appConfig.platforms[platformName] = {};

    console.log(chalk.green('App platform has been added'));

    if (await questionYesNo('Do you want to create default channels?', true)) {
      await createAppChannel(config, platformName, 'dev', 'Development', true);
      await createAppChannel(config, platformName, 'stage', 'Staging', false);
      await createAppChannel(config, platformName, 'prod', 'Production', false);
    }

    await saveConfigApp(config);

  }

  console.log(`You can use command ${chalk.grey(`cau channel add ${platformName} <channelKey>`)} to add a channel`);

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



