# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from dataclasses import dataclass

from taiga.invitations.choices import InvitationStatus
from taiga.invitations.models import Invitation
from taiga.projects.models import Project


@dataclass
class PublicInvitation:
    status: InvitationStatus
    email: str
    existing_user: bool
    project: Project


@dataclass
class CreateInvitations:
    invitations: list[Invitation]
    already_members: int
