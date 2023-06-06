/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { ShortcutsService } from '@taiga/core';
import { Membership, Project, Role, User } from '@taiga/data';

@UntilDestroy()
@Component({
  selector: 'tg-remove-member',
  templateUrl: './remove-member.component.html',
  styleUrls: ['./remove-member.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoveMemberComponent implements OnChanges {
  @Input() public project!: Project;
  @Input() public user!: User | null;
  @Input() public member!: Membership;
  @Input() public roles!: Role[];
  @Output() public dropdownStateChanged: EventEmitter<boolean> =
    new EventEmitter<boolean>();
  @Output() public confirmed = new EventEmitter();

  public hasSingleAdmin!: boolean;

  constructor(
    private cd: ChangeDetectorRef,
    public shortcutsService: ShortcutsService,
    private store: Store
  ) {}

  public removeDropdownState = false;
  public leaveDropdownState = false;

  public ngOnChanges() {
    this.hasSingleAdmin =
      this.roles?.find((it) => it.isAdmin)?.numMembers === 1 || false;
  }

  public confirm(isSelfUserLeaving?: boolean) {
    this.confirmed.emit(isSelfUserLeaving);
    this.removeDropdownState = false;
    this.emitDropdownStateChanged();
  }

  public openLeaveDropdown() {
    this.setCloseShortcut();
    this.leaveDropdownState = true;
    this.emitDropdownStateChanged();
  }

  public openRemoveDropdown() {
    this.setCloseShortcut();
    this.removeDropdownState = true;
    this.emitDropdownStateChanged();
  }

  public closeDropdown() {
    this.leaveDropdownState = false;
    this.removeDropdownState = false;
    this.emitDropdownStateChanged();

    this.cd.detectChanges();
  }

  public setCloseShortcut() {
    this.shortcutsService.setScope('remove-user');
    this.shortcutsService
      .task('remove-user.close')
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.closeDropdown();
      });
  }

  private emitDropdownStateChanged() {
    this.dropdownStateChanged.emit(
      this.removeDropdownState || this.leaveDropdownState
    );
  }
}
