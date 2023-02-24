/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { animate, style, transition, trigger } from '@angular/animations';
import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { EditProject, Invitation, Project, User } from '@taiga/data';
import { distinctUntilChanged, filter } from 'rxjs';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import * as ProjectActions from '~/app/modules/project/data-access/+state/actions/project.actions';
import { deleteProject } from '~/app/modules/project/data-access/+state/actions/project.actions';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { selectNotificationClosed } from '~/app/modules/project/feature-overview/data-access/+state/selectors/project-overview.selectors';
import { WsService } from '~/app/services/ws';
import { filterNil } from '~/app/shared/utils/operators';

import {
  editProject,
  initProjectOverview,
  resetOverview,
} from './data-access/+state/actions/project-overview.actions';
import { selectInvitations } from './data-access/+state/selectors/project-overview.selectors';

@UntilDestroy()
@Component({
  selector: 'tg-project-feature-overview',
  templateUrl: './project-feature-overview.component.html',
  styleUrls: ['./project-feature-overview.component.css'],
  providers: [RxState],
  animations: [
    trigger('slideOut', [
      transition(':leave', [
        animate(
          '300ms ease-in',
          style({
            blockSize: '0',
            opacity: '0',
          })
        ),
      ]),
    ]),
  ],
})
export class ProjectFeatureOverviewComponent
  implements AfterViewChecked, OnDestroy
{
  @ViewChild('descriptionOverflow')
  public descriptionOverflow?: ElementRef;

  public readonly model$ = this.state.select();

  public showDescription = false;
  public hideOverflow = false;
  public showEditProjectModal = false;
  public showDeleteProjectModal = false;
  public projectActionsDropdownState = false;

  constructor(
    private store: Store,
    private cd: ChangeDetectorRef,
    private wsService: WsService,
    private state: RxState<{
      project: Project;
      invitations: Invitation[];
      notificationClosed: boolean;
      user?: User | null;
    }>
  ) {
    this.state.connect('invitations', this.store.select(selectInvitations));
    this.state.connect('user', this.store.select(selectUser));
    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );
    this.state.connect(
      'notificationClosed',
      this.store.select(selectNotificationClosed)
    );

    this.state.hold(
      this.state
        .select('project')
        .pipe(distinctUntilChanged((prev, curr) => prev.id === curr.id)),
      () => {
        this.showDescription = false;
        this.hideOverflow = false;
        this.store.dispatch(initProjectOverview());

        this.cd.markForCheck();
      }
    );

    if (this.state.get('user')) {
      this.wsService
        .events<{ project: string }>({
          channel: `users.${this.state.get('user')!.username}`,
          type: 'projectinvitations.create',
        })
        .pipe(
          untilDestroyed(this),
          filter(
            (eventResponse) =>
              eventResponse.event.content.project ===
              this.state.get('project').id
          )
        )
        .subscribe(() => {
          this.store.dispatch(ProjectActions.eventInvitation());
        });
    }

    this.wsService
      .events<{ project: string }>({
        channel: `projects.${this.state.get('project').id}`,
        type: 'projectinvitations.revoke',
      })
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.wsService
          .command('unsubscribe_from_project_events', {
            project: this.state.get('project').id,
          })
          .subscribe();
        this.wsService
          .command('subscribe_to_project_events', {
            project: this.state.get('project').id,
          })
          .subscribe();
      });

    this.wsService
      .events<{ project: string }>({
        channel: `projects.${this.state.get('project').id}`,
        type: 'projectinvitations.revoke',
      })
      .pipe(
        untilDestroyed(this),
        filter(() => this.state.get('project').userIsAdmin)
      )
      .subscribe(() => {
        this.store.dispatch(ProjectActions.revokedInvitation());
      });

    this.wsService
      .events<{ project: string }>({
        channel: `projects.${this.state.get('project').id}`,
        type: 'projectinvitations.revoke',
      })
      .pipe(
        untilDestroyed(this),
        filter(() => !this.state.get('project').userIsAdmin),
        filter(() => this.state.get('project').userPermissions.length === 0)
      )
      .subscribe(() => {
        this.store.dispatch(ProjectActions.revokedNoPermissionInvitation());
      });
  }

  public hasClamping(el: HTMLElement) {
    const { clientHeight, scrollHeight } = el;
    return clientHeight !== scrollHeight;
  }

  public toggleShowDescription() {
    this.hideOverflow = !this.hideOverflow;
  }

  public submitEditProject(project: EditProject) {
    this.showEditProjectModal = false;
    this.store.dispatch(editProject({ project }));
  }

  public submitDeleteProject() {
    const project = this.state.get('project');
    this.store.dispatch(deleteProject({ id: project.id, name: project.name }));
  }

  public ngAfterViewChecked() {
    if (this.descriptionOverflow && !this.hideOverflow) {
      this.showDescription = this.hasClamping(
        this.descriptionOverflow.nativeElement as HTMLElement
      );
      this.cd.detectChanges();
    }
  }

  public ngOnDestroy() {
    this.store.dispatch(resetOverview());
  }
}
