/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  Directive,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ShortcutsService } from '@taiga/cdk/services/shortcuts';
import { filter } from 'rxjs';

@UntilDestroy()
@Directive({
  selector: '[tgShortcut]',
  standalone: true,
})
export class ShortcutDirective implements OnChanges, OnInit, OnDestroy {
  @Input()
  public tgShortcut!: typeof ShortcutsService.shortcuts[number]['task'];

  @Input()
  public scope?: string;

  @Input()
  public tgShortcutActive = true;

  @Output()
  public tgShortcutAction = new EventEmitter<void>();

  constructor(private shortcutsService: ShortcutsService) {}

  public start() {
    const task = ShortcutsService.shortcuts.find(
      (scopes) => scopes.task === this.tgShortcut
    );

    const scope = task?.scope ?? this.scope;

    if (scope) {
      this.shortcutsService.setScope(scope);
    }
  }

  public stop() {
    const task = ShortcutsService.shortcuts.find(
      (scopes) => scopes.task === this.tgShortcut
    );

    const scope = task?.scope ?? this.scope;

    if (scope) {
      this.shortcutsService.undoScope(scope);
    }
  }

  public ngOnInit() {
    this.shortcutsService
      .task(this.tgShortcut)
      .pipe(
        untilDestroyed(this),
        filter(() => this.tgShortcutActive)
      )
      .subscribe(() => {
        this.tgShortcutAction.next();
      });

    if (this.tgShortcutActive) {
      this.start();
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.tgShortcutActive) {
      if (this.tgShortcutActive) {
        this.start();
      } else {
        this.stop();
      }
    }
  }

  public ngOnDestroy(): void {
    this.stop();
  }
}
