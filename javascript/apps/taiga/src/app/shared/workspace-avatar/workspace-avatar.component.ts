/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { AfterViewInit, OnInit } from '@angular/core';
import {  ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { TuiSizeXS, TuiSizeXXL } from '@taiga-ui/core';
import { RandomColorService } from '../random-color/random-color.service';

@Component({
  selector: 'tg-workspace-avatar',
  templateUrl: './workspace-avatar.component.html',
  styleUrls: ['./workspace-avatar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceAvatarComponent implements OnInit, AfterViewInit  {

  @Input()
  public size: TuiSizeXS | TuiSizeXXL = 'l';

  @HostBinding('class') public sizeClass = `avatar-${this.size}`;
  @HostBinding('class') public colorClass = '';

  @Input()
  public name = '';

  @Input()
  public url = '';

  @Input()
  public color = 1;

  public ngOnInit() {
    this.sizeClass = `avatar-${this.size}`;
  }
  
  public ngAfterViewInit() {
    this.colorClass = RandomColorService.getColorClass(this.color);
  }

  public setAvatarName(name: string) {
    return name.substring(0, 2).split('').join(' ');
  }
}
