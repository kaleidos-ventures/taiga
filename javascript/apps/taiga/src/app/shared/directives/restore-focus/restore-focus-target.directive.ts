/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';

import { RestoreFocusService } from './restore-focus.service';

@Directive({
  selector: '[tgRestoreFocusTarget]',
  standalone: true,
})
export class RestoreFocusTargetDirective implements OnInit, OnDestroy {
  @Input('tgRestoreFocusTarget')
  public id!: string;

  constructor(
    private focusService: RestoreFocusService,
    private el: ElementRef
  ) {}

  public ngOnInit(): void {
    this.focusService.add(this.id, this.el.nativeElement as HTMLElement);
  }

  public ngOnDestroy(): void {
    this.focusService.delete(this.id);
  }
}
