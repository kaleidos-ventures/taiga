# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.invitations import repositories as invitations_repositories
from taiga.invitations.models import Invitation
from taiga.projects.models import Project
from taiga.roles import exceptions as roles_ex
from taiga.roles import repositories as roles_repositories
from taiga.users import repositories as users_repositories
from taiga.users.models import User


async def create_invitations(project: Project, invitations: list[dict[str, str]], invited_by: User) -> list[Invitation]:
    # project's roles dict, whose key is the role slug and value the Role object
    # {'admin': Role1, 'general': Role2}
    project_roles_dict = await roles_repositories.get_project_roles_as_dict(project=project)
    # set a list of roles slug {'admin', 'general'}
    project_roles_slugs = set(project_roles_dict.keys())
    # create two lists with roles_slug and emails received
    roles_slug = []
    emails = []
    for invitation in invitations:
        roles_slug.append(invitation["role_slug"])
        emails.append(invitation["email"])

    # if some role_slug doesn't exist in project's roles then raise an exception
    if not set(roles_slug).issubset(project_roles_slugs):
        raise roles_ex.NonExistingRoleError()

    # users dict, whose key is the email and value the User object
    # {'user1@taiga.demo': User1, 'user2@taiga.demo': User2}
    users_dict = await users_repositories.get_users_by_emails_as_dict(emails=emails)

    # create invitations objects list
    objs = []
    for email, role_slug in zip(emails, roles_slug):
        objs.append(
            Invitation(
                user=users_dict.get(email, None),
                project=project,
                role=project_roles_dict[role_slug],
                email=email,
                invited_by=invited_by,
            )
        )

    return await invitations_repositories.create_invitations(objs=objs)
