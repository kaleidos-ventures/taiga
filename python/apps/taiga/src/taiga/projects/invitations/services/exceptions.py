# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from taiga.base.services.exceptions import TaigaServiceException


class NonExistingUsernameError(TaigaServiceException):
    ...


class BadInvitationTokenError(TaigaServiceException):
    ...


class InvitationDoesNotExistError(TaigaServiceException):
    ...


class InvitationAlreadyAcceptedError(TaigaServiceException):
    ...


class InvitationRevokedError(TaigaServiceException):
    ...


class InvitationIsNotForThisUserError(TaigaServiceException):
    ...


class InvitationHasNoUserYetError(TaigaServiceException):
    ...


class NonExistingRoleError(TaigaServiceException):
    ...
