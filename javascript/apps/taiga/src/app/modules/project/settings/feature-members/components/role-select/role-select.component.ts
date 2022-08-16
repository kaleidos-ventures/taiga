/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Invitation, Membership, Role } from '@taiga/data';
import { membersActions } from '~/app/modules/project/settings/feature-members/+state/actions/members.actions';

@Component({
  selector: 'tg-members-role-select',
  templateUrl: './role-select.component.html',
  styleUrls: ['./role-select.component.css'],
})
export class RoleSelectComponent implements OnInit {
  @Input()
  public invitationOrMember!: Invitation | Membership;

  @Input()
  public roles!: Role[];

  @Input()
  public isMember!: boolean;

  @Input()
  public isSelf!: boolean;

  public roleForm!: FormGroup;
  public hasSingleAdmin!: boolean;
  public dropdownState = false;

  constructor(
    private store: Store,
    private actions$: Actions,
    private fb: FormBuilder
  ) {
    this.actions$.pipe(ofType(membersActions.resetRoleForm)).subscribe((data) => {
      if (data.userIdentification === (this.invitationOrMember as Membership).user.username || data.userIdentification === (this.invitationOrMember as Invitation).email) {
        this.roleForm = this.fb.group({
          roleName: data.oldRole?.name,
        });
      }
    });
  }

  public ngOnInit() {
    this.roleForm = this.fb.group({
      roleName: this.invitationOrMember.role?.name,
    });
    this.hasSingleAdmin = this.roles.find(it => it.isAdmin)?.numMembers === 1 || false;
  }

  public trackByIndex(index: number) {
    return index;
  }

  public roleChange(role: string) {
    const roleSlug = this.roles.find((it) => it.name === role)?.slug;
    if (this.isMember && roleSlug) {
      this.store.dispatch(
        membersActions.updateMemberRole({
          username: this.invitationOrMember.user?.username || '',
          roleSlug: roleSlug,
          oldRole: this.invitationOrMember.role
        })
      );
    } else {
      // TODO invitation role
    }
  }
}
