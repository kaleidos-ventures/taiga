/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

export interface SignUp {
  email: string;
  password: string;
  fullName: string;
  acceptProjectInvitation: boolean;
  projectInvitationToken?: string;
  acceptWorkspaceInvitation: boolean;
  workspaceInvitationToken?: string;
  nextProjectId?: string;
}
