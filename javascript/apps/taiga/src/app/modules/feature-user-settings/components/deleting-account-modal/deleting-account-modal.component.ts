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
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalModule } from '@taiga/ui/modal';
import { TranslocoModule } from '@ngneat/transloco';
import {
  TuiButtonModule,
  TuiLinkModule,
  TuiScrollbarModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SafeHtmlPipe } from '~/app/shared/pipes/safe-html/safe-html.pipe';
import { RxState } from '@rx-angular/state';
import {
  UserSettingsState,
  userSettingsFeature,
} from '~/app/modules/feature-user-settings/data-access/+state/reducers/user-settings.reducer';
import { Store } from '@ngrx/store';
import { ProjectSummaryCardComponent } from '~/app/shared/project-summary-card/project-summary-card.component';
import { AvatarModule } from '@taiga/ui/avatar';
import { ProjectsDropdownComponent } from '~/app/shared/projects-dropdown/projects-dropdown.component';
import { InlineNotificationComponent } from '@taiga/ui/inline-notification';
import { userSettingsActions } from '~/app/modules/feature-user-settings/data-access/+state/actions/user-settings.actions';

interface ComponentModel {
  accountInfo: UserSettingsState['deleteUserInfo'];
}

@Component({
  selector: 'tg-deleting-account-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalModule,
    TranslocoModule,
    TuiButtonModule,
    TuiLinkModule,
    TuiSvgModule,
    InputsModule,
    SafeHtmlPipe,
    ProjectSummaryCardComponent,
    TuiScrollbarModule,
    AvatarModule,
    ProjectsDropdownComponent,
    InlineNotificationComponent,
  ],
  templateUrl: './deleting-account-modal.component.html',
  styleUrls: ['./deleting-account-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class DeletingAccountModalComponent {
  @Input()
  public open = false;

  @Output()
  public discard = new EventEmitter<void>();

  @Output()
  public cancel = new EventEmitter<void>();

  private state = inject(RxState) as RxState<ComponentModel>;
  private store = inject(Store);

  public model$ = this.state.select();

  constructor() {
    this.state.connect(
      'accountInfo',
      this.store.select(userSettingsFeature.selectDeleteUserInfo)
    );
  }

  public deleteAccount = new FormGroup({
    confirmDelete: new FormControl(false, {
      validators: Validators.requiredTrue,
      nonNullable: true,
    }),
  });

  public confirmDelete() {
    this.deleteAccount.markAllAsTouched();

    if (this.deleteAccount.valid) {
      this.store.dispatch(userSettingsActions.confirmDeleteAccount());
    }
  }

  public trackById(_: number, item: { id: string }) {
    return item.id;
  }
}
