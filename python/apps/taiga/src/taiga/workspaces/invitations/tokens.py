# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from datetime import timedelta

from taiga.conf import settings
from taiga.tokens.base import Token


class WorkspaceInvitationToken(Token):
    token_type = "workspace-invitation"
    lifetime = timedelta(minutes=settings.WORKSPACE_INVITATION_LIFETIME)
