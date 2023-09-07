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
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { TranslocoDirective } from '@ngneat/transloco';
import { Store } from '@ngrx/store';
import {
  TuiLinkModule,
  TuiScrollbarModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { Invitation, Membership, User } from '@taiga/data';

import { of } from 'rxjs';
import { delay, take, tap } from 'rxjs/operators';

import { UserCardComponent } from '~/app/shared/user-card/user-card.component';
import { fadeIntOutAnimation } from '~/app/shared/utils/animations';
import { LeaveProjectDropdownComponent } from '~/app/modules/project/components/leave-project-dropdown/leave-project-dropdown.component';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { filterNil } from '~/app/shared/utils/operators';
import { leaveProject } from '~/app/modules/project/data-access/+state/actions/project.actions';
import { capitalizePipe } from '~/app/shared/pipes/capitalize/capitalize.pipe';
import { BadgeComponent } from '@taiga/ui/badge/badge.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'tg-project-members-list',
  standalone: true,
  templateUrl: './project-members-list.component.html',
  styleUrls: ['./project-members-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TuiScrollbarModule,
    TuiSvgModule,
    TuiLinkModule,
    UserCardComponent,
    ScrollingModule,
    LeaveProjectDropdownComponent,
    capitalizePipe,
    BadgeComponent,
    TranslocoDirective,
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
export class ProjectMembersListComponent implements OnChanges {
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

  public project$ = this.store.select(selectCurrentProject).pipe(filterNil());
  public leaveProjectDropdown = false;
  public totalAdmins = 0;

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

  public confirmLeaveProject() {
    this.project$.pipe(take(1)).subscribe((project) => {
      this.store.dispatch(
        leaveProject({
          id: project.id,
          name: project.name,
        })
      );
    });
  }

  public calculateTotalAdmins() {
    this.totalAdmins = this.members.filter(
      (member) => member.role?.isAdmin
    ).length;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.members) {
      this.calculateTotalAdmins();
    }
  }

  constructor(private cd: ChangeDetectorRef, private store: Store) {}
}
