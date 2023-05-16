# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from taiga.base.utils.datetime import aware_utcnow
from taiga.conf import settings
from taiga.projects.invitations.models import ProjectInvitation
from taiga.workspaces.invitations.models import WorkspaceInvitation


def is_spam(invitation: ProjectInvitation | WorkspaceInvitation) -> bool:
    last_send_at = invitation.resent_at if invitation.resent_at else invitation.created_at
    time_since_last_send = int((aware_utcnow() - last_send_at).total_seconds() / 60)  # in minutes
    return (
        invitation.num_emails_sent == settings.INVITATION_RESEND_LIMIT  # max invitations emails already sent
        or time_since_last_send < settings.INVITATION_RESEND_TIME  # too soon to send the invitation again
    )
