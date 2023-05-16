/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DropdownModule } from '~/app/shared/dropdown/dropdown.module';
import { Project } from '@taiga/data';
import { TranslocoModule } from '@ngneat/transloco';
import { TuiButtonModule, TuiHintModule, TuiLinkModule } from '@taiga-ui/core';
import { A11yModule } from '@angular/cdk/a11y';
import { RestoreFocusTargetDirective } from '~/app/shared/directives/restore-focus/restore-focus-target.directive';
import { RestoreFocusDirective } from '~/app/shared/directives/restore-focus/restore-focus.directive';
import { AutoFocusDirective } from '~/app/shared/directives/auto-focus/auto-focus.directive';

@Component({
  selector: 'tg-leave-project-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    DropdownModule,
    TranslocoModule,
    TuiButtonModule,
    TuiLinkModule,
    TuiHintModule,
    A11yModule,
    RestoreFocusTargetDirective,
    RestoreFocusDirective,
    AutoFocusDirective,
  ],
  templateUrl: './leave-project-dropdown.component.html',
  styleUrls: ['./leave-project-dropdown.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveProjectDropdownComponent {
  @Input()
  public project!: Project;

  @Input()
  public singleMember = false;

  @Output()
  public leaveProject = new EventEmitter<void>();

  @Output()
  public openDialog = new EventEmitter<boolean>();

  public get dropdownState() {
    return this.#dropdownState;
  }

  public set dropdownState(value: boolean) {
    this.openDialog.next(value);
    this.#dropdownState = value;
  }

  #dropdownState = false;

  public keep() {
    this.dropdownState = false;
  }

  public confirm() {
    this.dropdownState = false;
    this.leaveProject.next();
  }
}
