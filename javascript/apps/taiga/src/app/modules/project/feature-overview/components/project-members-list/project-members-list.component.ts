/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { animate, style, transition, trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { Invitation, Membership, User } from '@taiga/data';
import { of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { fadeIntOutAnimation } from '~/app/shared/utils/animations';

@Component({
  selector: 'tg-project-members-list',
  templateUrl: './project-members-list.component.html',
  styleUrls: ['./project-members-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  public onAcceptedInvitation = false;

  @Output()
  public hasAcceptedInvitation = new EventEmitter<void>();

  public userAnimationProgress = false;
  public animationSecondState = false;
  public animationFirstState = false;
  public animationPendingState = false;

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

  public acceptInvitationSlug() {
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

  constructor(private cd: ChangeDetectorRef) {}
}
