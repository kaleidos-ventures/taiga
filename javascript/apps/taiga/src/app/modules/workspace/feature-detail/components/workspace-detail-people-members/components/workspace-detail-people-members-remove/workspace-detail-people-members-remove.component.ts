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
import { RxState } from '@rx-angular/state';
import { WorkspaceMembership } from '@taiga/data';

@Component({
  selector: 'tg-workspace-detail-people-members-remove',
  templateUrl: './workspace-detail-people-members-remove.component.html',
  styleUrls: ['./workspace-detail-people-members-remove.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class WorkspaceDetailPeopleMembersRemoveComponent {
  @Input() public member!: WorkspaceMembership;
  @Output() public highlightRemoveMemberRow =
    new EventEmitter<WorkspaceMembership | null>();
  @Output() public removeMember = new EventEmitter<WorkspaceMembership>();

  public dropdownState = false;

  public initRemoveMember() {
    this.highlightRemoveMemberRow.next(this.member);
    this.dropdownState = true;
  }

  public keep() {
    this.dropdownState = false;
    this.highlightRemoveMemberRow.next(null);
  }

  public confirm() {
    this.dropdownState = false;
    this.highlightRemoveMemberRow.next(null);
    this.removeMember.next(this.member);
  }
}
