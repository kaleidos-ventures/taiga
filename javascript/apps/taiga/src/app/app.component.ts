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
