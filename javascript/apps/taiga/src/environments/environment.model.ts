import { Config } from '@taiga/data';

export interface Environment {
  production: boolean;
  configLocal?: Config;
  configRemote?: string;
}
