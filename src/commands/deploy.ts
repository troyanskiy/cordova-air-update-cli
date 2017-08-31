import * as chalk from 'chalk';
import * as semver from 'semver';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigStatus, IConfig, IConfigPlatformChannel, IServerAppMeta } from '../declarations';
import { checkConfig, createFileMap, getPlatformChannel, zip } from '../utils';
import { HttpRequest } from '../lib/request';

// import * as jwt from 'jsonwebtoken';

export async function run(config: IConfig) {



  const configStatus = await checkConfig(config);

  if (configStatus !== ConfigStatus.OK) {
    console.log(chalk.red('Can not proceed'));

    return;
  }

  const platformChannel = <IConfigPlatformChannel>getPlatformChannel(config, config.argv[0], config.argv[1]);

  if (!platformChannel) {
    return;
  }


  let serverData: IServerAppMeta = {
    version: '0.0.0',
    filesMap: {}
  };

  const channelId = platformChannel.id;

  const extras = config.argv
    .filter((str: string) => str.startsWith('--extra.'))
    .reduce((extra: any, currentValue: string) => {

      currentValue = currentValue.substr(8);

      const [key, value] = currentValue.split('=', 2);
      const keys = key.split('.');

      setExtra(extra, keys, value);

      return extra;
    }, {});

  try {
    const resp = await HttpRequest.request(`/deploy/${channelId}/meta/latest`);
    serverData = JSON.parse(resp.body);
  } catch (err) {

    // if (err.name === 'JsonWebTokenError') {
    //   console.log(chalk.red(err.message));
    //
    //   return;
    // }

    if (err.statusCode === 404) {
      console.log('First deploy');
    } else {
      console.log(chalk.red('Can not get version from server'));

      return;
    }

  }

  if (semver.lte(config.appPackage.version, serverData.version)) {
    console.log(chalk.red('Version of new update should be greater than on server'));
    console.log(`Local version: ${chalk.green(config.appPackage.version)}`);
    console.log(`Server version: ${chalk.green(serverData.version)}`);

    return;
  }
  // todo run prepare command


  const wwwDir = './platforms/ios/www';
  const localFilesMap = await createFileMap(wwwDir);


  const signedData = JSON.stringify({filesMap: localFilesMap, version: config.appPackage.version, extras});
  console.log('Files signature has been created');


  const resp = await HttpRequest.request(`/deploy/${channelId}?check=1`, {
    method: 'POST',
    json: {signedData}
  });

  const serverCheckResponse: IServerAppMeta = resp.body;

  const localFileMapToSend = serverCheckResponse.filesMap;
  const localFilesListToSend = Object.keys(localFileMapToSend);

  const sendZip: boolean = localFilesListToSend.length > 0;

  const zipFileName = 'cau.zip';

  if (sendZip) {

    console.log('Creating update ZIP with deltas');
    await zip(localFilesListToSend.map((file: string) => {
      return {
        src: path.join(wwwDir, file),
        dst: localFileMapToSend[file]
      };
    }), zipFileName);

    console.log('ZIP file has been created');

  }


  const formData: any = {
    signedData
  };

  if (sendZip) {
    formData.update = fs.createReadStream(zipFileName);
  }

  try {
    await HttpRequest.request(`/deploy/${channelId}`, {
      method: 'POST',
      formData
    });
  } catch (err) {
    // noop
  }

  if (sendZip) {
    fs.unlinkSync(zipFileName);
  }

}


function setExtra(extra: any, keys: string[], value: any) {

  const field = keys.shift();

  if (field) {

    if (keys.length) {

      if (extra[field] === undefined) {
        extra[field] = {};
      }

      setExtra(extra[field], keys, value);

    } else {

      extra[field] = convertExtraValue(value);

    }

  }

}

function convertExtraValue(value: string) {

  // number test
  const num = parseFloat(value);
  if (!isNaN(num) && num.toString() === value) {
    return num;
  }

  if (value.toLowerCase() === 'true') {
    return true;
  }

  if (value.toLowerCase() === 'false') {
    return false;
  }

  return value;

}
