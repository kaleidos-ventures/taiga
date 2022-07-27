/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@taiga/core';
import {
  Contact,
  InvitationRequest,
  InvitationResponse,
  SearchUserRequest,
} from '@taiga/data';

@Injectable({
  providedIn: 'root',
})
export class InvitationApiService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  public myContacts(emails: string[]) {
    return this.http.post<Contact[]>(`${this.config.apiUrl}/my/contacts`, {
      emails,
    });
  }

  public inviteUsers(slug: string, invitations: InvitationRequest[]) {
    return this.http.post<InvitationResponse>(
      `${this.config.apiUrl}/projects/${slug}/invitations`,
      {
        invitations,
      }
    );
  }

  public searchUser(data: SearchUserRequest) {
    return this.http.get<Contact[]>(
      `${this.config.apiUrl}/users/search?text=${data.text}&project=${data.project}&offset=${data.offset}&limit=${data.limit}`
    );
  }

  public resendInvitation(slug: string, usernameOrEmail: string) {
    return this.http.post(
      `${this.config.apiUrl}/projects/${slug}/invitations/resend`,
      {
        usernameOrEmail,
      }
    );
  }
}
