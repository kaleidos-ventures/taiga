# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.conf import settings
from taiga.permissions import choices
from tests.utils import factories as f
from tests.utils.images import valid_image_f

from .base import Factory, factory


class ProjectTemplateFactory(Factory):
    name = "Template name"
    slug = settings.DEFAULT_PROJECT_TEMPLATE
    description = factory.Sequence(lambda n: f"Description {n}")

    epic_statuses = []
    us_statuses = []
    us_duedates = []
    points = []
    task_statuses = []
    task_duedates = []
    issue_statuses = []
    issue_types = []
    issue_duedates = []
    priorities = []
    severities = []
    roles = []
    epic_custom_attributes = []
    us_custom_attributes = []
    task_custom_attributes = []
    issue_custom_attributes = []
    default_owner_role = "tester"

    class Meta:
        model = "projects.ProjectTemplate"
        django_get_or_create = ("slug",)


class ProjectFactory(Factory):
    name = factory.Sequence(lambda n: f"project {n}")
    owner = factory.SubFactory("tests.utils.factories.UserFactory")
    workspace = factory.SubFactory("tests.utils.factories.WorkspaceFactory")
    creation_template = factory.SubFactory("tests.utils.factories.ProjectTemplateFactory")
    logo = valid_image_f

    class Meta:
        model = "projects.Project"


def create_project(**kwargs):
    """Create project and its dependencies"""
    defaults = {}
    defaults.update(kwargs)

    workspace = defaults.pop("workspace", f.create_workspace())
    defaults["workspace"] = workspace
    defaults["owner"] = workspace.owner

    ProjectTemplateFactory.create(slug=settings.DEFAULT_PROJECT_TEMPLATE)

    project = ProjectFactory.create(**defaults)
    admin_role = f.RoleFactory.create(
        name="Administrators",
        slug="admin",
        permissions=choices.PROJECT_PERMISSIONS + choices.PROJECT_ADMIN_PERMISSIONS,
        is_admin=True,
        project=project,
    )
    f.RoleFactory.create(
        name="General Members",
        slug="general-members",
        permissions=choices.PROJECT_PERMISSIONS,
        is_admin=False,
        project=project,
    )

    f.MembershipFactory.create(user=project.owner, project=project, role=admin_role)

    return project
