/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Invitation, Membership, Role } from '@taiga/data';

@Component({
  selector: 'tg-members-role-select',
  templateUrl: './role-select.component.html',
  styleUrls: ['./role-select.component.css'],
})
export class RoleSelectComponent implements OnInit {
  @Input()
  public invitation?: Invitation;

  @Input()
  public member?: Membership;

  @Input()
  public roles!: Role[];

  public roleForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  public ngOnInit() {
    this.roleForm = this.fb.group({
      roleName: this.invitation
        ? this.invitation.role?.name
        : this.member?.role.name,
    });
  }

  public trackByIndex(index: number) {
    return index;
  }

  public roleChange(role: string) {
    // TODO update new role invitation
    console.log(role);
  }
}
