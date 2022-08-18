export interface IConfig {
  get: <T>(setting: string) => T;
  has: (setting: string) => boolean;
}

export interface OpenApiConfig {
  filePath: string;
  basePath: string;
  jsonPath: string;
  uiPath: string;
}

export interface PathParams {
  modelPath: string;
}

export interface ImountDirObj {
  physical: string;
  displayName: string;
}
