/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { Invitation, Membership } from '@taiga/data';

@Component({
  selector: 'tg-project-members-modal',
  templateUrl: './project-members-modal.component.html',
  styleUrls: ['./project-members-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectMembersModalComponent {
  @Input()
  public members: (Membership | Invitation)[] = [];

  @Input()
  public totalMembers = 0;

  @Input()
  public pending = 0;

  @Input()
  public totalPending = 0;

  @Output()
  public closeModal = new EventEmitter();

  @Output()
  public nextPage = new EventEmitter<number>();
}
