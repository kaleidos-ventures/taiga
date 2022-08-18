# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from asgiref.sync import sync_to_async
from taiga.base.utils.datetime import aware_utcnow
from taiga.invitations.choices import ProjectInvitationStatus

from .base import Factory, factory


class ProjectInvitationFactory(Factory):
    status = ProjectInvitationStatus.PENDING
    email = factory.Sequence(lambda n: f"user{n}@email.com")
    user = factory.SubFactory("tests.utils.factories.UserFactory")
    project = factory.SubFactory("tests.utils.factories.ProjectFactory")
    role = factory.SubFactory("tests.utils.factories.ProjectRoleFactory")
    invited_by = factory.SubFactory("tests.utils.factories.UserFactory")
    created_at = aware_utcnow()
    num_emails_sent = 1
    resent_at = None
    resent_by = None

    class Meta:
        model = "invitations.ProjectInvitation"


@sync_to_async
def create_project_invitation(**kwargs):
    return ProjectInvitationFactory.create(**kwargs)


def build_project_invitation(**kwargs):
    return ProjectInvitationFactory.build(**kwargs)
