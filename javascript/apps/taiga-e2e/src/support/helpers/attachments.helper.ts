/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

export const uploadFiles = (files: string[]) => {
  cy.getBySel('upload-attachment').selectFile(files, { force: true });
};

export const initDelete = (index: number) => {
  cy.getBySel('delete-attachment').eq(index).click();
};
