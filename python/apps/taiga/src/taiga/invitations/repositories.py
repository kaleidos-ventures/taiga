# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from asgiref.sync import sync_to_async
from taiga.invitations.models import Invitation, InvitationStatus


@sync_to_async
def create_invitations(objs: list[Invitation]) -> list[Invitation]:
    """
    This repository create invitations in bulk
    """
    return Invitation.objects.bulk_create(objs=objs)


@sync_to_async
def get_project_invitations(project_slug: str) -> list[Invitation]:
    project_invitees = Invitation.objects.filter(
        project__slug=project_slug, status=InvitationStatus.PENDING.value
    ).select_related("user", "role")

    # pending invitations with NULL users will implicitly be listed after invitations with users (and valid full names)
    return list(project_invitees.order_by("user__full_name"))
