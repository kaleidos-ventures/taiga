# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from tests.utils.images import valid_image_f

from .base import Factory, factory


class ProjectTemplateFactory(Factory):
    name = "Template name"
    slug = "scrum"
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
