import * as chalk from 'chalk';

import { IConfig } from './declarations';
import { HttpRequest } from './lib/request';
import { getPackage } from './utils';
// import { prettyJSON } from './utils';


function getConfig(): IConfig {

  const rootPath = process.cwd();

  const argv: string[] = process.argv.slice(2);

  let configApp: any;
  try {
    configApp = require(`${rootPath}/cau.config.json`);
  } catch (err) {
    configApp = null;
  }


  let appPackage: any;
  try {
    appPackage = getPackage();
  } catch (err) {
    console.log(chalk.red('package.json is not found'));
    process.exit(1);
  }

  return {appConfig: configApp, rootPath, argv, appPackage};

}


export function run() {

  const config: IConfig = getConfig();

  if (config.argv.length) {

    const commands = ['init', 'login', 'logout', 'app', 'platform', 'channel', 'deploy', 'revoke', 'register', 'help'];
    const command = config.argv[0];

    if (commands.indexOf(command) > -1) {
      config.argv = config.argv.slice(1);
      // console.log(prettyJSON(config));

      HttpRequest.init(config);

      try {
        require(`./commands/${command}`).run(config);
      } catch (err) {
        // noop
      }

      return;
    }

    require('./commands/help').run(config);

  }


}
