import * as chalk from 'chalk';

import { CommandCrud, IConfig } from '../declarations';
import {
  checkBeforeCreateAppChannel, createAppChannel, defCRUDCommand, question, questionYesNo, saveConfigApp,
  testPlatform
} from '../utils';

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
    console.log(`Ex: ${chalk.grey('cau channel add <platform> <channelKey>')}`);

    return;
  }

  const channelKey = config.argv[1] ? config.argv[1].trim() : null;

  if (!channelKey) {
    console.log(chalk.red('Channel Key is missing'));
    console.log(`Ex: ${chalk.grey('cau channel add <platform> <channelKey>')}`);

    return;
  }

  checkBeforeCreateAppChannel(config, platformName, channelKey);

  console.log(`Creating new channel with key ${chalk.gray(channelKey)} on ${chalk.gray(platformName)} platform`);

  const channelName = await question({
    text: `Enter channel name (${chalk.gray(channelKey)}): `,
    def: channelKey
  });

  const def = await questionYesNo('Is it default channel?', false);

  try {
    await createAppChannel(config, platformName, channelKey, channelName, def);
  } catch (err) {
    console.log(chalk.red('Fail to add channel'));

    return;
  }

  await saveConfigApp(config);

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



