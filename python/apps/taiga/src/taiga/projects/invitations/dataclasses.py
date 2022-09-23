# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from dataclasses import dataclass

from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.invitations.models import ProjectInvitation
from taiga.projects.projects.models import Project


@dataclass
class PublicProjectInvitation:
    status: ProjectInvitationStatus | str
    email: str
    existing_user: bool
    project: Project


@dataclass
class CreateProjectInvitations:
    invitations: list[ProjectInvitation]
    already_members: int
