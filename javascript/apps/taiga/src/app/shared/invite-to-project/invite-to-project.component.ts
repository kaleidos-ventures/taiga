/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Project, User } from '@taiga/data';

@Component({
  selector: 'tg-invite-to-project',
  templateUrl: './invite-to-project.component.html',
  styleUrls: [
    './styles/invite-to-project.shared.css',
    './invite-to-project.component.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteToProjectComponent {
  @Input()
  public project!: Project;

  @Output()
  public finishNewProject = new EventEmitter<Partial<User>[]>();

  @Output()
  public closeModal = new EventEmitter();

  public regexpEmail = /\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,4})+/g;
  public inviteEmails = '';
  public inviteEmailsErrors: {
    required: boolean;
    regex: boolean;
    listEmpty: boolean;
    peopleNotAdded: boolean;
    bulkError: boolean;
    moreThanFifty: boolean;
  } = {
    required: false,
    regex: false,
    listEmpty: false,
    peopleNotAdded: false,
    bulkError: false,
    moreThanFifty: false,
  };

  // This is a temporal variable until we get real users here.
  public userExample: Partial<User>[] = [
    {
      username: '@test-user',
      fullName: 'Test User',
      roles: ['General'],
      id: 1,
    },
    {
      username: '@test-user-2',
      fullName: 'Test User2',
      roles: ['General'],
      id: 2,
    },
    {
      username: undefined,
      fullName: undefined,
      email: 'test@test.com',
      roles: ['General'],
      id: 2,
    },
  ];

  public inviteProjectForm: FormGroup = this.fb.group({
    users: new FormArray([]),
  });

  constructor(private fb: FormBuilder, private route: ActivatedRoute) {}

  public get users() {
    return (this.inviteProjectForm.controls['users'] as FormArray)
      .controls as FormGroup[];
  }

  public get validEmails() {
    return this.inviteEmails?.match(this.regexpEmail) || [];
  }

  public emailsWithoutDuplications() {
    const emails = this.validEmails;
    return emails?.filter((email, i) => emails.indexOf(email) === i);
  }

  public trackByIndex(index: number) {
    return index;
  }

  public resetErrors() {
    this.inviteEmailsErrors = {
      required: false,
      regex: false,
      listEmpty: false,
      peopleNotAdded: false,
      bulkError: false,
      moreThanFifty: false,
    };
  }

  public addUser() {
    //TODO connect with the api to verify the email
    const emailRgx = this.regexpEmail.test(this.inviteEmails);
    const bulkErrors = this.inviteEmails
      .replace(this.regexpEmail, '')
      .replace(/[;,\s\n]/g, '');
    this.resetErrors();
    if (this.inviteEmails === '') {
      this.inviteEmailsErrors.required = true;
    } else if (!emailRgx) {
      this.inviteEmailsErrors.regex = true;
    } else if (bulkErrors) {
      this.inviteEmailsErrors.bulkError = true;
    } else {
      // to test more than 50 users
      Array.from(Array(51).keys()).forEach(() =>
        this.users.push(this.fb.group(this.userExample[0]))
      );
      // this.users.push(this.fb.group(this.userExample[0]));
      this.inviteEmails = '';
    }
  }

  public deleteUser(i: number) {
    (this.inviteProjectForm.controls['users'] as FormArray).removeAt(i);
  }

  public sendForm() {
    this.resetErrors();
    if (this.users.length > 50) {
      this.inviteEmailsErrors.moreThanFifty = true;
    } else if (this.users.length) {
      this.finishNewProject.next(this.userExample);
      this.close();
    } else {
      this.inviteEmailsErrors.listEmpty = true;
    }
    this.inviteEmailsErrors.peopleNotAdded = !!this.inviteEmails;
  }

  public close() {
    this.closeModal.next();
  }
}
