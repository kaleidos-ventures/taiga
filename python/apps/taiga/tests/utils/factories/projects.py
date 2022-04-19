# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from asgiref.sync import sync_to_async
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


@sync_to_async
def create_project_template(**kwargs):
    return ProjectTemplateFactory.create(**kwargs)


class ProjectFactory(Factory):
    name = factory.Sequence(lambda n: f"Project {n}")
    slug = factory.Sequence(lambda n: f"project-{n}")
    description = factory.Sequence(lambda n: f"Description {n}")
    owner = factory.SubFactory("tests.utils.factories.UserFactory")
    workspace = factory.SubFactory("tests.utils.factories.WorkspaceFactory")
    creation_template = factory.SubFactory("tests.utils.factories.ProjectTemplateFactory")
    logo = valid_image_f

    class Meta:
        model = "projects.Project"


@sync_to_async
def create_project(**kwargs):
    """Create project and its dependencies"""
    defaults = {}
    defaults.update(kwargs)
    workspace = defaults.pop("workspace", None) or f.WorkspaceFactory.create(**defaults)
    defaults["workspace"] = workspace
    defaults["owner"] = defaults.pop("owner", None) or workspace.owner
    ProjectTemplateFactory.create(slug=settings.DEFAULT_PROJECT_TEMPLATE)

    project = ProjectFactory.create(**defaults)
    admin_role = f.RoleFactory.create(
        name="Administrator",
        slug="admin",
        permissions=choices.PROJECT_PERMISSIONS,
        is_admin=True,
        project=project,
    )
    f.RoleFactory.create(
        name="General",
        slug="general",
        permissions=choices.PROJECT_PERMISSIONS,
        is_admin=False,
        project=project,
    )

    f.MembershipFactory.create(user=project.owner, project=project, role=admin_role)

    return project


def build_project(**kwargs):
    return ProjectFactory.build(**kwargs)
