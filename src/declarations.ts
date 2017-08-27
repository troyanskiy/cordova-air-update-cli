export interface IConfig {
  rootPath: string;
  argv: string[];
  appConfig: IConfigApp;
  appPackage: IPackageJson;
}

export interface IConfigApp {
  id?: string;
  appCode: string;
  appName?: string;
  platforms?: {[platform: string]: IConfigPlatformChannels};
  user?: string;
  server?: string;
}


export interface IConfigPlatformChannels {
  [channel: string]: IConfigPlatformChannel;
}

export interface IConfigPlatformChannel {
  id: string;
  name: string;
  def?: boolean;
  prepareCommand?: string;
}

export interface IConfigUser {
  user?: string;
  server?: string;
}


export interface IPackageJson {
  name: string;
  version: string;
}

export interface IQuestionsOptions {
  text: string;
  def: string;
  isPassword?: boolean;
  validator?(answer: string): boolean;
}

export interface IServerAppMeta {
  version: string;
  filesMap: IFilesMap;
}

export interface IFilesMap {
  [file: string]: string;
}

export enum ConfigStatus {
  NotInitialized,
  NoServer,
  NoUser,
  OK
}

export enum CommandCrud {
  Add,
  Remove,
  List,
  Help,
  Fail
}

export interface IZipFileEntry {
  src: string;
  dst: string;
}
