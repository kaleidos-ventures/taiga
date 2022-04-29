# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from asgiref.sync import sync_to_async
from taiga.invitations.choices import InvitationStatus

from .base import Factory, factory


class InvitationFactory(Factory):
    status = InvitationStatus.PENDING
    email = factory.Sequence(lambda n: f"user{n}@email.com")
    user = factory.SubFactory("tests.utils.factories.UserFactory")
    project = factory.SubFactory("tests.utils.factories.ProjectFactory")
    role = factory.SubFactory("tests.utils.factories.RoleFactory")
    invited_by = factory.SubFactory("tests.utils.factories.UserFactory")

    class Meta:
        model = "projects.Invitation"


@sync_to_async
def create_invitation(**kwargs):
    return InvitationFactory.create(**kwargs)


def build_invitation(**kwargs):
    return InvitationFactory.build(**kwargs)
