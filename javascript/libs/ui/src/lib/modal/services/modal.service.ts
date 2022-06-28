/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable, Provider } from '@angular/core';
import {
  AbstractTuiDialogService,
  TuiDialog,
  TUI_DIALOGS,
} from '@taiga-ui/cdk';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { ModalWrapperComponent } from '../components/wrapper/modal-wrapper.component';

@Injectable({
  providedIn: 'root',
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ModalService extends AbstractTuiDialogService<any> {
  private context!: TuiDialog<unknown, unknown>;
  public defaultOptions = {} as const;

  public component = new PolymorpheusComponent(ModalWrapperComponent);

  public setContext(context: TuiDialog<unknown, unknown>) {
    this.context = context;
  }

  public getContext() {
    return this.context;
  }
}

export const PROMPT_PROVIDER: Provider = {
  provide: TUI_DIALOGS,
  useExisting: ModalService,
  multi: true,
};
