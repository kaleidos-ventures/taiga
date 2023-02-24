/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { animate, style, transition, trigger } from '@angular/animations';
import {
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { Store } from '@ngrx/store';
import {
  TuiHintModule,
  TuiLinkModule,
  TuiScrollbarModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { Invitation, Membership, User } from '@taiga/data';
import { AvatarModule } from '@taiga/ui/avatar';
import { BadgeModule } from '@taiga/ui/badge/badge.module';
import { SkeletonsModule } from '@taiga/ui/skeletons/skeletons.module';
import { of } from 'rxjs';
import { delay, take, tap } from 'rxjs/operators';
import {
  selectCanPaginate,
  selectLoadingMoreMembers,
} from '~/app/modules/project/feature-overview/data-access/+state/selectors/project-overview.selectors';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { CapitalizePipeModule } from '~/app/shared/pipes/capitalize/capitalize.pipe.module';
import { UserCardComponent } from '~/app/shared/user-card/user-card.component';
import { fadeIntOutAnimation } from '~/app/shared/utils/animations';

@Component({
  selector: 'tg-project-members-list',
  standalone: true,
  templateUrl: './project-members-list.component.html',
  styleUrls: ['./project-members-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SkeletonsModule,
    TuiScrollbarModule,
    TuiSvgModule,
    AvatarModule,
    CommonTemplateModule,
    TuiLinkModule,
    UserCardComponent,
    TuiHintModule,
    ScrollingModule,
    BadgeModule,
    CapitalizePipeModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'project_overview',
        alias: 'project_overview',
      },
    },
  ],
  animations: [
    fadeIntOutAnimation,
    trigger('fadeInRight', [
      transition(':enter', [
        style({
          visibility: 'visible',
          opacity: 0,
          transform: 'translate3d(30px, 0, 0)',
          offset: 0,
          width: 0,
        }),
        animate(
          '300ms ease-in',
          style({
            opacity: 1,
            transform: 'translate3d(0, 0, 0)',
            offset: 1,
            width: '*',
          })
        ),
      ]),
      transition(':leave', [
        style({
          opacity: 1,
          transform: 'translate3d(0, 0, 0)',
          offset: 1,
          width: '*',
        }),
        animate(
          '300ms ease-in',
          style({
            visibility: 'visible',
            opacity: 0,
            transform: 'translate3d(30px, 0, 0)',
            offset: 0,
            width: 0,
          })
        ),
      ]),
    ]),
  ],
})
export class ProjectMembersListComponent {
  @Input()
  public members: (Membership | Invitation)[] = [];

  @Input()
  public leaveProject = true;

  @Input()
  public user: User | null = null;

  @Input()
  public showAcceptInvitationButton = false;

  @Input()
  public membersToAnimate: string[] = [];

  @Input()
  public invitationsToAnimate: string[] = [];

  @Input()
  public paginate = false;

  @Output()
  public hasAcceptedInvitation = new EventEmitter<void>();

  @Output()
  public nextPage = new EventEmitter<number>();

  @ViewChild(CdkVirtualScrollViewport)
  public virtualScroll?: CdkVirtualScrollViewport;

  public userAnimationProgress = false;
  public animationSecondState = false;
  public animationFirstState = false;
  public animationPendingState = false;

  public loading$ = this.store.select(selectLoadingMoreMembers);
  public canPaginate$ = this.store.select(selectCanPaginate);

  public trackById(_index: number, member: Membership | Invitation) {
    const user = this.getUser(member);

    return user.username ?? user.email;
  }

  public getUser(member: Membership | Invitation): Partial<User> {
    if ('email' in member) {
      if (member.user) {
        return member.user;
      }
      return { email: member.email };
    }
    return member.user;
  }

  public getEmail(member: Membership | Invitation): Partial<User> {
    if ('email' in member) {
      if (member.user) {
        return member.user;
      }
      return { email: member.email };
    }

    return member.user;
  }

  public isPending(member: Membership | Invitation) {
    if ('email' in member) {
      return true;
    }

    return false;
  }

  public acceptInvitationId() {
    this.hasAcceptedInvitation.next();
    this.showAcceptInvitationButton = false;
  }

  public onScroll() {
    this.canPaginate$.pipe(take(1)).subscribe((canPaginate) => {
      if (this.virtualScroll && canPaginate) {
        const renderedRange = this.virtualScroll.getRenderedRange();
        const end = renderedRange.end;
        const total = this.members.length;

        if (end === total) {
          this.nextPage.next(end);
        }
      }
    });
  }

  public animateUser() {
    this.animationPendingState = true;
    this.cd.detectChanges();
    of(true)
      .pipe(
        delay(100 + 300), // DelayTime + AnimationTime
        tap(() => {
          this.animationFirstState = true;
          this.cd.detectChanges();
        }),
        delay(200 + 300), // DelayTime + AnimationTime
        tap(() => {
          this.animationSecondState = true;
          this.cd.detectChanges();
        }),
        delay(0 + 300), // DelayTime + AnimationTime
        tap(() => {
          this.animationPendingState = false;
          this.animationSecondState = false;
          this.animationFirstState = false;
          this.cd.detectChanges();
        })
      )
      .subscribe();
  }

  public checkAnimation(member: Membership | Invitation) {
    const newMemberToProject =
      member.user && this.membersToAnimate.includes(member.user.username);
    const newInvitationToMember =
      member.user && this.invitationsToAnimate.includes(member.user.username);
    const newInvitationToNonMember =
      (member as Invitation).email &&
      this.invitationsToAnimate.includes((member as Invitation).email);

    return (
      !!newMemberToProject ||
      !!newInvitationToMember ||
      !!newInvitationToNonMember
    );
  }

  constructor(private cd: ChangeDetectorRef, private store: Store) {}
}
