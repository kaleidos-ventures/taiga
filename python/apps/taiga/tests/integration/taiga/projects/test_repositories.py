# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from django.core.files import File
from taiga.projects import repositories
from tests.utils import factories as f
from tests.utils.images import valid_image_f

pytestmark = pytest.mark.django_db


##########################################################
# create_project
##########################################################


def test_create_project_with_non_ASCI_chars():
    workspace = f.WorkspaceFactory()
    project = repositories.create_project(
        name="My proj#%&乕شect", description="", color=3, owner=workspace.owner, workspace=workspace
    )
    assert project.slug.startswith("my-projhu-shect")


def test_create_project_with_logo():
    workspace = f.WorkspaceFactory()
    project = repositories.create_project(
        name="My proj#%&乕شect", description="", color=3, owner=workspace.owner, workspace=workspace, logo=valid_image_f
    )
    assert valid_image_f.name in project.logo.name


def test_create_project_with_no_logo():
    workspace = f.WorkspaceFactory()
    project = repositories.create_project(
        name="My proj#%&乕شect", description="", color=3, owner=workspace.owner, workspace=workspace, logo=None
    )
    assert project.logo == File(None)


##########################################################
# get_project
##########################################################


def test_get_project_return_project():
    project = f.ProjectFactory(name="Project 1")
    assert repositories.get_project(slug=project.slug) == project


def test_get_project_return_none():
    assert repositories.get_project(slug="project-not-exist") is None


##########################################################
# get_template
##########################################################


def test_get_template_return_template():
    template = f.ProjectTemplateFactory()
    assert repositories.get_template(slug=template.slug) == template
