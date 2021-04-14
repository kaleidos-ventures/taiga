import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { WsService } from '@taiga/ws';

@NgModule({
  imports: [
    AppModule,
    ServerModule,
  ],
  providers: [
    {
      provide: WsService, useValue: {
        listen: () => {
          return undefined;
        }
      }
    }
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}
