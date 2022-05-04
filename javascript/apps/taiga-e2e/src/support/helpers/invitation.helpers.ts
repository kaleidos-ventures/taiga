/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

export const typeEmailToInvite = (email: string) =>
  cy.getBySel('input-add-invites').type(email);
export const addEmailToInvite = () => {
  cy.getBySel('add-invites', { timeout: 100000 }).click();
};
export const deleteUserFromList = () => cy.getBySel('delete-user').click();
export const inviteUsers = () => cy.getBySel('submit-invite-users').click();
