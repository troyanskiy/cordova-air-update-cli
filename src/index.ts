import { IConfig } from './declarations';


function getConfig(): IConfig {

  const rootPath = process.cwd();
  const homePath = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

  const argv: string[] = process.argv.slice(2);

  let configApp: any;
  try {
    configApp = require(`${rootPath}/cau.config.json`);
  } catch (err) {
    configApp = {};
  }


  let configUser: any;
  try {
    configUser = require(`${homePath}/.cau/config.json`);
  } catch (err) {
    configUser = {};
  }

  return {...configUser, ...configApp, rootPath, argv};

}


export function run() {

  const config: IConfig = getConfig();

  if (config.argv.length) {

    const commands = ['login', 'logout', 'register', 'init', 'create', 'deploy', 'revoke', 'help'];
    const command = config.argv[0];

    if (commands.indexOf(command) > -1) {
      require(`./commands/${command}`).run(config);

      return;
    }

    require('./commands/help').run(config);

  }


}
