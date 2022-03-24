/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { TuiDialog } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';

@Component({
  selector: 'tg-ui-modal-wrapper',
  template: `
    <section
      polymorpheus-outlet
      [content]="context.content"
      [context]="context"></section>
  `,
  styleUrls: ['./modal-wrapper.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalWrapperComponent {
  constructor(
    @Inject(POLYMORPHEUS_CONTEXT)
    public context: TuiDialog<unknown, unknown>
  ) {}

  public close() {
    this.context.completeWith(null);
  }
}
