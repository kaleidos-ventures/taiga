/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslocoModule } from '@ngneat/transloco';
import { TuiButtonModule } from '@taiga-ui/core';
import { ContextNotificationComponent } from '@taiga/ui/context-notification/context-notification.component';
import { ModalComponent } from '@taiga/ui/modal/components';

@Component({
  selector: 'tg-delete-workspace',
  templateUrl: './workspace-delete-modal.component.html',
  styleUrls: ['./workspace-delete-modal.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    TuiButtonModule,
    ModalComponent,
    ContextNotificationComponent,
  ],
})
export class DeleteWorkspaceComponent {
  @Input()
  public projects!: number;

  @Output()
  public closeModal = new EventEmitter<void>();

  @Input()
  public set show(show: boolean) {
    this.showDeleteWorkspaceModal = show;
  }

  public showDeleteWorkspaceModal = false;

  public close() {
    this.closeModal.next();
  }
}
