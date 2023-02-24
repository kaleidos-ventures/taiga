/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

export const WaitingForContextClosing = 300;

const ToastAnimationTime = 400;
export const WaitingForToastNotification =
  WaitingForContextClosing + ToastAnimationTime;

const MemberAnimationTime = 1200;
export const WaitingForMemberAnimation =
  WaitingForToastNotification + MemberAnimationTime;
