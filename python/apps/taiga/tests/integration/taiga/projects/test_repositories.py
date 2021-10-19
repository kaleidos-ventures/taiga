# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


import pytest
from taiga.projects import repositories
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# create_project
##########################################################


def test_create_project_with_non_ASCI_chars():
    user = f.UserFactory()
    workspace = f.WorkspaceFactory(owner=user)
    project = repositories.create_project(
        name="My proj#%&乕شect", description="", color=3, owner=user, workspace=workspace
    )
    assert project.slug.startswith("my-projhu-shect")


##########################################################
# get_project
##########################################################


def test_get_project_return_project():
    project = f.ProjectFactory(name="Project 1")
    assert repositories.get_project(project.slug) == project


def test_get_project_return_none():
    f.ProjectFactory(name="Project 1")
    assert repositories.get_project("project-not-exist") is None
