# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from asgiref.sync import sync_to_async
from taiga.base.utils.datetime import aware_utcnow
from taiga.permissions import choices
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.projects import repositories as projects_repositories
from taiga.projects.projects.models import ProjectTemplate
from tests.utils import factories as f
from tests.utils.images import valid_image_f

from .base import Factory, factory

# PROJECT ROLE


class ProjectRoleFactory(Factory):
    name = factory.Sequence(lambda n: f"Role {n}")
    slug = factory.Sequence(lambda n: f"test-role-{n}")
    permissions = choices.ProjectPermissions.values
    is_admin = False
    project = factory.SubFactory("tests.utils.factories.ProjectFactory")

    class Meta:
        model = "projects_roles.ProjectRole"


@sync_to_async
def create_project_role(**kwargs):
    return ProjectRoleFactory.create(**kwargs)


def build_project_role(**kwargs):
    return ProjectRoleFactory.build(**kwargs)


# PROJECT MEMBERSHIP


class ProjectMembershipFactory(Factory):
    user = factory.SubFactory("tests.utils.factories.UserFactory")
    project = factory.SubFactory("tests.utils.factories.ProjectFactory")
    role = factory.SubFactory("tests.utils.factories.ProjectRoleFactory")

    class Meta:
        model = "projects_memberships.ProjectMembership"


@sync_to_async
def create_project_membership(**kwargs):
    return ProjectMembershipFactory.create(**kwargs)


def build_project_membership(**kwargs):
    return ProjectMembershipFactory.build(**kwargs)


# PROJECT INVITATION


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
        model = "projects_invitations.ProjectInvitation"


@sync_to_async
def create_project_invitation(**kwargs):
    return ProjectInvitationFactory.create(**kwargs)


def build_project_invitation(**kwargs):
    return ProjectInvitationFactory.build(**kwargs)


# PROJECT


class ProjectFactory(Factory):
    name = factory.Sequence(lambda n: f"Project {n}")
    description = factory.Sequence(lambda n: f"Description {n}")
    owner = factory.SubFactory("tests.utils.factories.UserFactory")
    created_at = aware_utcnow()
    created_by = factory.SubFactory("tests.utils.factories.UserFactory")
    workspace = factory.SubFactory("tests.utils.factories.WorkspaceFactory")
    logo = valid_image_f

    class Meta:
        model = "projects.Project"


@sync_to_async
def create_simple_project(**kwargs):
    return ProjectFactory.create(**kwargs)


@sync_to_async
def create_project(**kwargs):
    """Create project and its dependencies"""
    defaults = {}
    defaults.update(kwargs)
    workspace = defaults.pop("workspace", None) or f.WorkspaceFactory.create(**defaults)
    defaults["workspace"] = workspace
    defaults["owner"] = defaults.pop("owner", None) or workspace.owner

    project = ProjectFactory.create(**defaults)
    template = ProjectTemplate.objects.first()
    projects_repositories.apply_template_to_project_sync(project=project, template=template)

    admin_role = project.roles.get(is_admin=True)
    ProjectMembershipFactory.create(user=project.owner, project=project, role=admin_role)

    return project


def build_project(**kwargs):
    return ProjectFactory.build(**kwargs)
