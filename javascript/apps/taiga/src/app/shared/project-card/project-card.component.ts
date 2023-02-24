/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  animate,
  keyframes,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TuiHintModule, TuiSvgModule } from '@taiga-ui/core';
import { Project, Workspace } from '@taiga/data';
import { AvatarModule } from '@taiga/ui/avatar';
import { BadgeModule } from '@taiga/ui/badge/badge.module';
import { distinctUntilChanged, map, skip } from 'rxjs/operators';
import { selectAcceptedInvite } from '~/app/shared/invite-to-project/data-access/+state/selectors/invitation.selectors';
import { CommonTemplateModule } from '../common-template.module';
import { DataAccessInvitationToProjectModule } from '../invite-to-project/data-access/+state/invite-to-project-data-access.module';
import { InviteToProjectModule } from '../invite-to-project/invite-to-project.module';
import { CapitalizePipeModule } from '../pipes/capitalize/capitalize.pipe.module';
const cssValue = getComputedStyle(document.documentElement);

type CardVariant = 'project' | 'placeholder' | 'invitation';
@UntilDestroy()
@Component({
  selector: 'tg-project-card',
  standalone: true,
  templateUrl: './project-card.component.html',
  styleUrls: ['./project-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    TuiSvgModule,
    CommonTemplateModule,
    AvatarModule,
    InviteToProjectModule,
    TuiHintModule,
    DataAccessInvitationToProjectModule,
    BadgeModule,
    CapitalizePipeModule,
  ],
  animations: [
    trigger('invitationAccepted', [
      transition('* => done', [
        style({
          outline: 'solid 2px transparent',
        }),
        animate(
          '600ms ease-in-out',
          style({
            outline: `solid 1px ${cssValue.getPropertyValue(
              '--color-primary'
            )}`,
          })
        ),
      ]),
    ]),
    trigger('itemSlideOutAnimation', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateY(5px)',
        }),
        animate(
          '600ms ease-out',
          keyframes([
            style({
              transform: 'translateY(5px)',
              offset: 0.5,
            }),
            style({
              opacity: 1,
              transform: 'translateY(0)',
              offset: 1,
            }),
          ])
        ),
      ]),
      transition(':leave', [
        style({
          transform: 'translateY(0)',
          opacity: 1,
          blockSize: '*',
          margin: '*',
          padding: '*',
        }),
        animate(
          '300ms ease-out',
          keyframes([
            style({
              opacity: 0,
              offset: 0.7,
            }),
            style({
              transform: 'translateY(-30px)',
              opacity: 0,
              blockSize: 0,
              margin: '0',
              padding: '0',
              offset: 1,
            }),
          ])
        ),
      ]),
    ]),
  ],
})
export class ProjectCardComponent implements OnInit {
  constructor(private store: Store, private cd: ChangeDetectorRef) {}

  @Input()
  public variant: CardVariant = 'project';

  @Input()
  public workspace!: Workspace;

  @Input()
  public firstProject = false;

  @Input()
  public project?: Pick<
    Project,
    'id' | 'name' | 'slug' | 'description' | 'color' | 'logoSmall'
  >;

  @Input()
  public acceptedInvites: string[] = [];

  @Output()
  public rejectInvite = new EventEmitter<Project['id']>();

  @Output()
  public acceptInvite = new EventEmitter<{
    name: Project['name'];
    id: Project['id'];
  }>();

  @HostBinding('attr.data-invite-status')
  public invitationStatus: 'accepted' | null = null;

  public animationState = '';

  public invitationStatus$ = this.store.select(selectAcceptedInvite);
  public rejectedByAdmin = false;

  public animationAcceptedInvitation: 'done' | null = null;

  public ngOnInit(): void {
    if (
      this.project &&
      this.acceptedInvites.length &&
      this.acceptedInvites.includes(this.project?.id)
    ) {
      this.invitationStatus = 'accepted';
      this.cd.markForCheck();
    }
    this.invitationStatus$
      .pipe(
        untilDestroyed(this),
        map((accepted) => {
          if (
            (this.project && accepted.includes(this.project.id)) ||
            this.rejectedByAdmin
          ) {
            return 'accepted';
          }

          return null;
        }),
        distinctUntilChanged(),
        skip(1)
      )
      .subscribe((invitationStatus) => {
        this.invitationStatus = invitationStatus;
        this.cd.markForCheck();
      });
  }

  public onRejectInvite() {
    if (this.project) {
      if (this.workspace.userRole === 'admin') {
        this.rejectedByAdmin = true;
        this.invitationStatus = 'accepted';
      }

      this.rejectInvite.next(this.project.id);
    }
  }

  public invitationAccepted() {
    this.animationAcceptedInvitation = 'done';
  }
}
