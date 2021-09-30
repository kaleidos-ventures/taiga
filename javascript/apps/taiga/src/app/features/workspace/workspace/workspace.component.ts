/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { animate, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, EventEmitter, Output, Input } from '@angular/core';
import { RxState } from '@rx-angular/state';

import { Workspace } from '@taiga/data';

@Component({
  selector: 'tg-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({
          height: '0',
          opacity: '0'
        }),
        animate('200ms ease-in', style({
          height: '*',
          opacity: '1'
        }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({
          height: '0',
          opacity: '0'
        }))
      ])
    ])
  ]
})
export class WorkspaceComponent {

  @Input()
  public workspaceList!: Workspace[];

  @Output()
  public hideActivity = new EventEmitter<boolean>();

  public showCreate = false;

  public toggleActivity(show: boolean) {
    this.hideActivity.next(show);
  }

  public toggleCreate(show: boolean) {
    this.showCreate = show;
  }

}
