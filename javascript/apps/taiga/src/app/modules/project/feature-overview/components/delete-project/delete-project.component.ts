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
import { TranslocoModule } from '@ngneat/transloco';
import { TuiAutoFocusModule } from '@taiga-ui/cdk';
import { TuiButtonModule, TuiLinkModule } from '@taiga-ui/core';
import { Project } from '@taiga/data';
import { ContextNotificationModule } from '@taiga/ui/context-notification/context-notification.module';
import { ModalModule } from '@taiga/ui/modal';

@Component({
  selector: 'tg-delete-project',
  templateUrl: './delete-project.component.html',
  styleUrls: ['./delete-project.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslocoModule,
    TuiButtonModule,
    TuiLinkModule,
    ModalModule,
    TuiAutoFocusModule,
    ContextNotificationModule,
  ],
})
export class DeleteProjectComponent {
  @Input()
  public project!: Project;

  @Output()
  public closeModal = new EventEmitter<void>();

  @Output()
  public submitDelete = new EventEmitter<void>();

  @Input()
  public set show(show: boolean) {
    this.showDeleteProjectModal = show;
  }

  public showDeleteProjectModal = false;

  public submit() {
    this.submitDelete.next();
  }

  public close() {
    this.closeModal.next();
  }
}
