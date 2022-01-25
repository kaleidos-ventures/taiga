# @taiga/ws

Listen Taiga websocket events.

## Install

```bash
npm i -S @taiga/ws
```

## Configure

In your root module.

```ts
import { WsModule } from '@taiga/ws';

@NgModule({
  imports: [
    WsModule.forRoot({
      url: 'wss://localhost:8080/events',
    }),
  ],
})
export class AppModule {}
```

Start listening ws events

```ts
import { Component } from '@angular/core';
import { WsService } from '@taiga/ws';

@Component({
  selector: 'tg-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  public title = 'taiga';

  constructor(private wsService: WsService) {
    this.wsService.listen();
  }
}
```

## Usage

[Check the workflow documentation](/javascript/docs/workflows/ws.workflow.md)

## Running unit tests

Run `nx test ws` to execute the unit tests.
