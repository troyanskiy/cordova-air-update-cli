import * as fs from 'fs';
import * as chalk from 'chalk';
import * as readline from 'readline';
import * as path from 'path';
import * as archiver from 'archiver';
import {
  CommandCrud,
  ConfigStatus,
  IConfig,
  IConfigPlatformChannel,
  IConfigPlatformChannels,
  IConfigUser,
  IFilesMap,
  IPackageJson,
  IQuestionsOptions,
  IZipFileEntry
} from './declarations';
import { HttpRequest } from './lib/request';
import { RequestResponse } from 'request';

const ET = require('elementtree');

const md5File = require('md5-file');

/**
 * Write to file
 *
 * @param {string} file
 * @param {string} data
 * @returns {Promise<any>}
 */
export function writeFile(file: string, data: string): Promise<any> {

  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

}

/**
 * Create pretty string jsons
 *
 * @param data
 * @returns {string}
 */
export function prettyJSON(data: any): string {
  return JSON.stringify(data, null, 2);
}


/**
 * Generic input
 * @param {IQuestionsOptions} options
 * @returns {Promise<string>}
 */
export function question(options: IQuestionsOptions): Promise<string> {
  return new Promise((resolve, reject) => {

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    if (options.isPassword) {

      const stdin = process.openStdin();
      let i = 0;

      process.stdin.on('data', function (char: any) {
        char = char.toString();
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004':
            stdin.pause();
            break;
          default:
            process.stdout.write('\x33[2K\x33[200D' + options.text + '[' + ((i % 2 === 1) ? '=-' : '-=') + ']'); //tslint:disable-line
            i++;
        }
      });
    }

    rl.question(options.text, (answer: string) => {
      // rl.history = rl.history.slice(1);
      rl.close();

      answer = answer.trim();

      if (!answer && options.def) {
        answer = <string>options.def;
      }

      if (options.validator && !options.validator(answer)) {
        return question(options)
          .then((answer) => resolve(answer));
      }

      resolve(answer);
    });

  });
}

/**
 * Generic question yes not
 *
 * @param {string} text
 * @param {boolean} def
 * @returns {Promise<boolean>}
 */
export function questionYesNo(text: string, def: boolean = false): Promise<boolean> {

  const vars = def ? 'Y/n' : 'y/N';

  const textN = `${text} (${chalk.grey(vars)}) `;

  return question({text: textN, def: def ? 'y' : 'n'})
    .catch(() => 'n')
    .then((answer: string) => {

      answer = answer.toLowerCase();

      switch (answer) {
        case 'y':
        case 'yes':
          return true;
        case 'n':
        case 'no':
          return false;
      }

      console.log(chalk.red(`Wrong answer: ${answer}`));

      return questionYesNo(text, def);
    });

}

/**
 * Get server config
 *
 * @param {boolean} ask
 * @returns {Promise<IConfigUser>}
 */
export async function getCustomServer(ask: boolean = false): Promise<IConfigUser | null> {

  if (ask) {
    if (!await questionYesNo('Would you like to set update server address', true)) {
      return null;
    }
  }

  const configUser: IConfigUser = {
    server: await askForApiServerAddress()
  };

  const userToken = await askIfWantToLogin(<string>configUser.server);
  if (userToken) {
    configUser.user = <string>userToken;
  }

  return configUser;
}

// export async function askIfNeedToAddServerAddress(): Promise<string | null> {
//   if (await questionYesNo('Would you like to set update server address', true)) {
//     return  askForApiServerAddress();
//   }
//
//   return null;
// }

/**
 * Enter server address
 *
 * @returns {Promise<string>}
 */
export async function askForApiServerAddress(): Promise<string> {

  let server = await question({
    text: `Enter update server api address (Ex: ${chalk.grey('https://update.domain.com/api')}): `,
    def: ''
  });

  server = server.trim();

  if (!server.startsWith('http://') && !server.startsWith('https://')) {
    console.log(chalk.red('Seems server address is not valid'));

    return askForApiServerAddress();
  }

  return server;
}

/**
 * Prompt question is user want's to login
 *
 * @param {string} server
 * @returns {Promise<string>}
 */
export async function askIfWantToLogin(server: string): Promise<string | null> {
  if (await questionYesNo(`Would you like to login to ${server}`, true)) {
    return doLogin(server);
  }

  return null;
}

/**
 * Do login to update server
 *
 * @param {string} server
 * @returns {Promise<string>}
 */
export async function doLogin(server: string = ''): Promise<string | null> {

  if (!server) {
    return null;
  }

  const login = await question({
    text: 'Username: ',
    def: '',
    validator: (answer: string) => {
      if (answer.length === 0) {
        console.log(chalk.red('User name is empty'));

        return false;
      }

      return true;
    }
  });

  const password = await question({
    text: `Password (${chalk.grey('input is hidden')}): `,
    def: '',
    // isPassword: true,
    validator: (answer: string) => {
      if (answer.length === 0) {
        console.log(chalk.red('Password is empty'));
      }

      return answer.length > 0;
    }
  });

  console.log(login, password);
  try {
    const response = await HttpRequest.request('/auth/login', {
      method: 'POST',
      json: {login, password}
    });

    if (response.headers['x-user-token']) {
      return <string>response.headers['x-user-token'];
    }

  } catch (err) {
    // noop
  }

  return null;

}


/**
 * Save config to the file
 *
 * @param {IConfig} config
 * @returns {Promise<void>}
 */
export async function saveConfigApp(config: IConfig): Promise<void> {

  const cauConfigStr = prettyJSON(config.appConfig);

  try {
    await writeFile(`${config.rootPath}/cau.config.json`, cauConfigStr);
  } catch (err) {
    console.log(chalk.red('Unable to write to cau.config.json'));
    console.log(err);
    process.exit(1);
  }

}

/**
 * Get Config Status code
 *
 * @param {IConfig} config
 * @returns {ConfigStatus}
 */
export function getConfigStatus(config: IConfig): ConfigStatus {

  if (!config.appConfig) {
    return ConfigStatus.NotInitialized;
  }

  if (!config.appConfig.server) {
    return ConfigStatus.NoServer;
  }

  if (!config.appConfig.user) {
    return ConfigStatus.NoUser;
  }

  return ConfigStatus.OK;

}

/**
 * Check config
 *
 * @param {IConfig} config
 * @param {string} mode
 * @returns {Promise<ConfigStatus>}
 */
export async function checkConfig(config: IConfig, mode: string = 'save'): Promise<ConfigStatus> {
  const status = getConfigStatus(config);

  switch (status) {

    case ConfigStatus.OK:
      return status;

    case ConfigStatus.NotInitialized:
      console.log(chalk.red('cordova-air-update is not initialized for the project'));
      console.log(`run in console ${chalk.green('cau init')} command`);
      process.exit(1);
      break;

    case ConfigStatus.NoServer:
      if (mode === 'login') {
        console.log(chalk.red('Server address is not set for the project'));
      }
      const customUserConfig = await getCustomServer(true);
      if (customUserConfig) {
        Object.assign(config.appConfig, customUserConfig);
      }
      break;

    case ConfigStatus.NoUser:
      const token = mode === 'login' ?
        await doLogin(<string>config.appConfig.server) :
        await askIfWantToLogin(<string>config.appConfig.server);
      if (token) {
        config.appConfig.user = <string>token;
      }

  }

  await saveConfigApp(config);

  return getConfigStatus(config);

}

/**
 * Test your platform name
 *
 * @param {string} name
 * @returns {string}
 */
export function testPlatform(name: string): string | null {

  if (!name) {
    return null;
  }

  name = name.toString().trim().toLowerCase();

  return (name === 'ios' || name === 'android') ? name : null;
}

export function testPlatformIfExists(config: IConfig, platform: string): string | null {

  platform = <string>testPlatform(platform);
  if (!platform) {
    return null;
  }

  return config.appConfig && config.appConfig.platforms && config.appConfig.platforms[platform] ? platform : null;

}

export function getPlatformChannel(config: IConfig, platform: string, channel: string): IConfigPlatformChannel | null {

  const platformTested = <string>testPlatformIfExists(config, platform);
  if (!platformTested) {
    console.log(chalk.red(`Seems ${platform} does not exists`));

    return null;
  }

  const appConfig = config.appConfig;

  if (!appConfig || !appConfig.platforms) {
    return null;
  }

  const channels: IConfigPlatformChannels = appConfig.platforms[platform];

  if (!channels || Object.keys(channels).length === 0) {
    console.log(chalk.red(`Channels for ${platform} does not exists`));

    return null;
  }

  if (!channel) {

    console.log('Channel key was not provided. Looking for default channel');

    for (const channelKey in channels) {
      if (!channel && channels.hasOwnProperty(channelKey) && channels[channelKey].def) {
        channel = channelKey;
      }
    }

    if (!channel) {
      console.log(chalk.red(`Default channel was not found.`));
      console.log(`Exists channels are: ${chalk.gray(Object.keys(channels).join(', '))}`);

      return null;
    }

    console.log(`Found default channel key ${channel}`);

  }

  if (!channels[channel]) {
    console.log(chalk.red(`Channel ${channel} for ${platform} does not exists`));
    console.log(`Exists channels are: ${chalk.gray(Object.keys(channels).join(', '))}`);

    return null;
  }

  return channels[channel];

}

/**
 * Crud commands checker
 *
 * @param {IConfig} config
 * @returns {Promise<CommandCrud>}
 */
export async function defCRUDCommand(config: IConfig): Promise<CommandCrud> {

  const configStatus = await checkConfig(config);

  if (configStatus !== ConfigStatus.OK) {
    return CommandCrud.Fail;
  }

  let command = 'help';

  if (config.argv.length) {
    command = config.argv[0];
    config.argv.shift();
  }

  switch (command) {

    case 'add':
      return CommandCrud.Add;

    case 'remove':
    case 'rm':
      return CommandCrud.Remove;

    case 'list':
    case 'ls':
      return CommandCrud.List;

    default:
      return CommandCrud.Help;

  }

}

/**
 * Create app on server
 *
 * @param {IConfig} config
 * @returns {Promise<void>}
 */
export function createAppOnServer(config: IConfig): Promise<void> {

  return HttpRequest.request('/app', {
    method: 'POST',
    json: {
      code: config.appConfig.appCode,
      name: config.appConfig.appName
    }
  })
    .then((resp: RequestResponse) => {
      config.appConfig.id = resp.body._id;
    });

}

export function checkBeforeCreateAppChannel(config: IConfig, platform: string, channelKey: string) {

  platform = <string>testPlatform(platform);

  if (!platform) {
    console.log(chalk.red('Platform name is not correct'));
    process.exit(1);

    return;
  }

  const appConfig = config.appConfig;
  const channels = appConfig.platforms ? appConfig.platforms[platform] : null;

  if (!channels) {
    console.log(chalk.red('App is not created on server'));
    console.log(`Please run command ${chalk.grey(`cau app add ${platform}`)} to create a platform`);
    process.exit(1);

    return;
  }

  if (channels[channelKey]) {
    console.log(chalk.red(`Channel ${channelKey} is already exists on ${platform} platform`));
    process.exit(0);

    return;
  }

}

/**
 * Creates update channel for app
 *
 * @param {IConfig} config
 * @param {string} platform
 * @param {string} channelKey
 * @param {string} channelName
 * @param {boolean} def
 * @returns {Promise<void>}
 */
export async function createAppChannel(config: IConfig,
                                       platform: string,
                                       channelKey: string,
                                       channelName: string,
                                       def: boolean = false): Promise<void> {

  checkBeforeCreateAppChannel(config, platform, channelKey);

  platform = <string>testPlatform(platform);
  const appConfig = config.appConfig;
  const channels = appConfig.platforms ? appConfig.platforms[platform] : null;

  if (!channels) {
    return;
  }

  if (def) {
    for (const key in channels) {
      if (channels.hasOwnProperty(key)) {
        channels[key].def = false;
      }
    }
  }

  const resp = await HttpRequest.request(`/app/${config.appConfig.id}/channel`, {
    method: 'POST',
    json: {
      platform,
      code: channelKey,
      name: channelName
    }
  });

  const id = resp.body._id;

  // const id = `test_${Math.ceil(Math.random() * 99999999)}`;

  channels[channelKey] = {id, name: channelName, def} as IConfigPlatformChannel;

  console.log(`Channel ${chalk.grey(channelName)} has been created. Key: ${chalk.green(channelKey)} ID: ${chalk.green(id)}`);


}

/**
 * Rad all fs
 * @param {string} dir
 * @param {string} basePath
 * @param {string[]} fileList
 * @return {string[]}
 */
export function readAllDirs(dir: string, basePath: string = '', fileList: string[] = []): string[] {

  fs.readdirSync(dir).forEach((file: string) => {

    const filePath = path.join(dir, file);
    const theFile = path.join(basePath, file);

    if (fs.statSync(filePath).isDirectory()) {
      readAllDirs(filePath, theFile, fileList);
    } else {
      fileList.push(theFile);
    }

  });

  return fileList;

}

/**
 * Create files map
 *
 * @param {string} dir
 * @return {Promise<IFilesMap>}
 */
export async function createFileMap(dir: string): Promise<IFilesMap> {

  const filesList = readAllDirs(dir);

  const filesMap: any = {};

  for (let i = 0; i < filesList.length; i++) {

    const file = path.join(dir, filesList[i]);
    const hash = await md5FilePromise(file);

    filesMap[filesList[i]] = hash;

  }

  return filesMap;

}

/**
 * Get MD5 of file
 *
 * @param {string} file
 * @return {Promise<string>}
 */
export function md5FilePromise(file: string): Promise<string> {

  return new Promise((resolve, reject) => {
    md5File(file, (err: any, hash: string) => {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });

}

/**
 * Create ZIP archive
 * @param {IZipFileEntry[]} files
 * @param {string} zipFileName
 * @returns {Promise<number>}
 */
export function zip(files: IZipFileEntry[], zipFileName: string): Promise<number> {
  return new Promise((resolve, reject) => {

    const output = fs.createWriteStream(zipFileName);
    const archive = archiver('zip', {
      zlib: {level: 9} // Sets the compression level.
    });

    // listen for all archive data to be written
    output.on('close', function () {
      resolve(archive.pointer());
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function (err) {
      if (err.code === 'ENOENT') {
        // log warning
        console.log(err);
      } else {
        // throw error
        reject(err);
      }
    });

    // good practice to catch this error explicitly
    archive.on('error', function (err) {
      reject(err);
    });

    // pipe archive data to the file
    archive.pipe(output);

    files.forEach((file: IZipFileEntry) => {
      archive.file(file.src, {name: file.dst});
    });

    archive.finalize();

  });
}

export function getPackage(): IPackageJson {

  let contents = fs.readFileSync('./config.xml', 'utf-8');

  if (contents) {
    //Windows is the BOM. Skip the Byte Order Mark.
    contents = contents.substring(contents.indexOf('<'));
  }

  const elm = new ET.ElementTree(ET.XML(contents));

  const widget = elm._root;

  const version = widget.get('version');

  const nameEl = elm.findall('name')[0];

  const name = nameEl.text;

  return { version, name };

}

export function generateRandomString(iterations: number = 16): string {
  let str = '';
  while (iterations > 0) {
    iterations--;
    str += Math.random().toString(36).substring(2, 10);
  }

  return str;
}
