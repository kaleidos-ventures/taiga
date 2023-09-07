/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Membership, Project } from '@taiga/data';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { WsService } from '~/app/services/ws';
import { filterNil } from '~/app/shared/utils/operators';
import { membersActions } from './+state/actions/members.actions';
import {
  selectTotalInvitations,
  selectTotalMemberships,
} from './+state/selectors/members.selectors';
import { RouterLinkActive, RouterLink, RouterOutlet } from '@angular/router';
import { TuiTabsModule } from '@taiga-ui/kit';
import { TuiButtonModule, TuiSvgModule } from '@taiga-ui/core';

import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@ngneat/transloco';
import { ModalComponent } from '@taiga/ui/modal/components';
import { InviteUserModalComponent } from '~/app/shared/invite-user-modal/invite-user-modal.component';
import { TitleComponent } from '~/app/shared/title/title.component';

interface ComponentState {
  project: Project;
  totalMembers: number;
  totalPending: number;
}

@UntilDestroy()
@Component({
  selector: 'tg-projects-settings-feature-members',
  templateUrl: './feature-members.component.html',
  styleUrls: [
    './feature-members.component.css',
    '../styles/settings.styles.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    TitleComponent,
    TuiButtonModule,
    TuiTabsModule,
    RouterLinkActive,
    RouterLink,
    TuiSvgModule,
    RouterOutlet,
    ModalComponent,
    InviteUserModalComponent,
  ],
})
export class ProjectsSettingsFeatureMembersComponent {
  public model$ = this.state.select();
  public invitePeopleModal = false;
  public selectedTab = 1;

  constructor(
    private store: Store,
    private state: RxState<ComponentState>,
    private wsService: WsService
  ) {
    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );

    this.state.connect(
      'totalMembers',
      this.store.select(selectTotalMemberships)
    );

    this.state.connect(
      'totalPending',
      this.store.select(selectTotalInvitations)
    );

    this.store.dispatch(membersActions.initProjectMembers());

    this.initWSsubscriptions();
  }

  public openModal() {
    this.invitePeopleModal = true;
  }

  public closeModal() {
    this.invitePeopleModal = false;
  }

  public onInviteSuccess() {
    this.store.dispatch(
      membersActions.updateMembersList({ eventType: 'create' })
    );
  }

  public handleA11y(tab: number) {
    this.selectedTab = tab;
  }

  public initWSsubscriptions() {
    this.wsService
      .events<{ project: string }>({
        channel: `projects.${this.state.get('project').id}`,
        type: 'projectinvitations.revoke',
      })
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store.dispatch(
          membersActions.updateMembersList({ eventType: 'update' })
        );
      });

    this.wsService
      .events<{ project: string }>({
        channel: `projects.${this.state.get('project').id}`,
        type: 'projectinvitations.create',
      })
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store.dispatch(
          membersActions.updateMembersList({ eventType: 'create' })
        );
      });

    this.wsService
      .events<{ project: string }>({
        channel: `projects.${this.state.get('project').id}`,
        type: 'projectinvitations.update',
      })
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store.dispatch(
          membersActions.updateMembersList({ eventType: 'update' })
        );
      });

    this.wsService
      .events<{ membership: Membership; workspace: string }>({
        channel: `projects.${this.state.get('project').id}`,
        type: 'projectmemberships.delete',
      })
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store.dispatch(
          membersActions.updateMembersList({ eventType: 'update' })
        );
      });
  }
}
