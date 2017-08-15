export interface IConfig extends IConfigApp {
  rootPath: string;
  argv: string[];
}

export interface IConfigApp extends IConfigUser {
  appName: string;
  envs: { [env: string]: IConfigEnv };
}

export interface IConfigEnv extends IConfigUser {
  token: string;
}

export interface IConfigUser {
  user?: string;
  server?: string;
}

