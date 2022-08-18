/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
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
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { Project, Workspace } from '@taiga/data';
import { distinctUntilChanged, map, skip } from 'rxjs/operators';
import { selectAcceptedInvite } from '../invite-to-project/data-access/+state/selectors/invitation.selectors';

type CardVariant = 'project' | 'placeholder' | 'invitation';
@UntilDestroy()
@Component({
  selector: 'tg-project-card',
  templateUrl: './project-card.component.html',
  styleUrls: ['./project-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
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
    'name' | 'slug' | 'description' | 'color' | 'logoSmall'
  >;

  @Output()
  public rejectInvite = new EventEmitter<Project['slug']>();

  @Output()
  public acceptInvite = new EventEmitter<{
    name: Project['name'];
    slug: Project['slug'];
  }>();

  @HostBinding('attr.data-invite-status')
  public invitationStatus: 'accepted' | null = null;

  public animationState = '';

  public invitationStatus$ = this.store.select(selectAcceptedInvite);
  public rejectedByAdmin = false;

  public ngOnInit(): void {
    this.invitationStatus$
      .pipe(
        untilDestroyed(this),
        map((accepted) => {
          if (
            (this.project && accepted.includes(this.project.slug)) ||
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

      this.rejectInvite.next(this.project.slug);
    }
  }
}
