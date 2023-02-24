/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { TuiDialog } from '@taiga-ui/cdk';
import { ModalService } from '@taiga/ui/modal/services/modal.service';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';

@Component({
  selector: 'tg-ui-modal-wrapper',
  template: `<ng-container
    *polymorpheusOutlet="$any(context.content) as text; context: context">
    {{ text }}
  </ng-container>`,
  styleUrls: ['./modal-wrapper.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalWrapperComponent {
  constructor(
    @Inject(POLYMORPHEUS_CONTEXT)
    public context: TuiDialog<unknown, unknown>,
    public modalService: ModalService
  ) {
    this.modalService.setContext(context);
  }
}
