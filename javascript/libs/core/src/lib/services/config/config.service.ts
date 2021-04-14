import { Injectable } from '@angular/core';
import { Config } from '@taiga/data';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  public get config(): Config {
    return this._config;
  }

  public _config!: Config;

  public get apiUrl(): string {
    return this.config.api;
  }

  public get wsUrl(): string {
    return this.config.ws;
  }
}
