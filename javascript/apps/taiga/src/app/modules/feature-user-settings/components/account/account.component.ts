/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TitleComponent } from '~/app/shared/title/title.component';
import { TranslocoModule } from '@ngneat/transloco';
import { Store } from '@ngrx/store';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { RxState } from '@rx-angular/state';
import { type User } from '@taiga/data';
import { filterNil } from '~/app/shared/utils/operators';
import { UserCardComponent } from '~/app/shared/user-card/user-card.component';
import { WatchElementDirective } from '~/app/shared/directives/watch-element/watch-element.directive';
import { TuiButtonModule, TuiSvgModule } from '@taiga-ui/core';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DeletingAccountModalComponent } from '../deleting-account-modal/deleting-account-modal.component';
import { userSettingsFeature } from '~/app/modules/feature-user-settings/data-access/+state/reducers/user-settings.reducer';
import { userSettingsActions } from '~/app/modules/feature-user-settings/data-access/+state/actions/user-settings.actions';

interface ComponentModel {
  user: User;
  deletingAccountModal: boolean;
}

@Component({
  selector: 'tg-account',
  standalone: true,
  imports: [
    CommonModule,
    TitleComponent,
    TranslocoModule,
    UserCardComponent,
    WatchElementDirective,
    TuiSvgModule,
    TuiButtonModule,
    InputsModule,
    DeletingAccountModalComponent,
  ],
  templateUrl: './account.component.html',
  styleUrls: ['../../styles/user-settings.css', './account.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class AccountComponent {
  private store = inject(Store);
  private state = inject(RxState) as RxState<ComponentModel>;

  public model$ = this.state.select();
  public deleteAccount = new FormGroup({
    confirmDelete: new FormControl(false, {
      validators: Validators.requiredTrue,
      nonNullable: true,
    }),
  });

  constructor() {
    this.state.connect('user', this.store.select(selectUser).pipe(filterNil()));
    this.state.connect(
      'deletingAccountModal',
      this.store.select(userSettingsFeature.selectDeletingAccountModal)
    );
  }

  public initDeleteAccount() {
    this.deleteAccount.markAllAsTouched();

    if (this.deleteAccount.valid) {
      this.store.dispatch(userSettingsActions.initDeleteAcccount());
    }
  }

  public cancelDeletingAccountModal() {
    this.store.dispatch(userSettingsActions.cancelDeleteAccount());
  }
}
