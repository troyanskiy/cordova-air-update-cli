// tslint:disable-next-line:no-duplicate-imports
import * as request from 'request';
import { CoreOptions, RequestResponse } from 'request';
import * as chalk from 'chalk';

import { IConfig } from '../declarations';


export class HttpRequest {

  private static config: IConfig;

  static init(config: IConfig) {
    this.config = config;
  }


  static request(url: string, options: CoreOptions = {}): Promise<RequestResponse> {

    options = {...this.getOptions(), ...options};

    return new Promise((resolve, reject) => {
      request(this.getUrl(url), options, (error: any, response: RequestResponse, body: any) => {

        if (!response || !response.statusCode || response.statusCode < 200 || response.statusCode > 299) {
          if (response) {
            console.log(chalk.red(`Error: ${response.statusMessage} (${response.statusCode})`));
          } else {
            console.log(chalk.red(`Seems server is not available.`));
          }
          reject(response);
        } else {
          if (response.headers['content-type'] &&
              response.headers['content-type'].indexOf('application/json') > -1 &&
              typeof response.body === 'string'
          ) {
            response.body = JSON.parse(response.body);
          }
          resolve(response);
        }

      });
    });
  }


  private static getUrl(url: string): string {

    if (!this.config.appConfig) {
      return '';
    }

    const appConfig = this.config.appConfig;

    if (!appConfig.server) {
      return '';
    }

    if (appConfig.server.endsWith('/') && url.startsWith('/')) {
      url = url.substr(1);
    }

    return appConfig.server + url;

  }

  private static getOptions(): CoreOptions {

    const options: request.CoreOptions = {};

    if (this.config.appConfig && this.config.appConfig.user) {
      options.auth = {
        sendImmediately: true,
        bearer: this.config.appConfig.user
      };
    }

    return options;
  }

}
