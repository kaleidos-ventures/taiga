# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from taiga.auth.serializers import AccessTokenWithRefreshSerializer
from taiga.projects.invitations.models import ProjectInvitation
from taiga.users.serializers import VerificationInfoSerializer
from taiga.workspaces.invitations.models import WorkspaceInvitation


def serialize_verification_info(
    auth: AccessTokenWithRefreshSerializer,
    project_invitation: ProjectInvitation | None,
    workspace_invitation: WorkspaceInvitation | None,
) -> VerificationInfoSerializer:
    return VerificationInfoSerializer(
        auth=auth,
        project_invitation=project_invitation,
        workspace_invitation=workspace_invitation,
    )
