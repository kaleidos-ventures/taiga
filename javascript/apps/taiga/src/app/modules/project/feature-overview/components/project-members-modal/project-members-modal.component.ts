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
import { TranslocoDirective } from '@ngneat/transloco';
import {
  TuiButtonModule,
  TuiScrollbarModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { Invitation, Membership, User } from '@taiga/data';

import { ProjectMembersListComponent } from '../project-members-list/project-members-list.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'tg-project-members-modal',
  standalone: true,
  templateUrl: './project-members-modal.component.html',
  styleUrls: ['./project-members-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TuiSvgModule,
    TuiScrollbarModule,
    ProjectMembersListComponent,
    TranslocoDirective,
    TuiButtonModule,
  ],
})
export class ProjectMembersModalComponent {
  @Input()
  public user: User | null = null;

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
}
