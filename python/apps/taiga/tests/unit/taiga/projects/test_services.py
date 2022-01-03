# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

import pytest
from fastapi import UploadFile
from taiga.exceptions import services as ex
from taiga.projects import services
from tests.utils import factories as f
from tests.utils.images import valid_image_upload_file

pytestmark = pytest.mark.django_db


def test_create_project():
    user = f.UserFactory()
    workspace = f.WorkspaceFactory(owner=user)

    with patch("taiga.projects.services.projects_repo") as fake_project_repository:
        fake_project_repository.create_project.return_value = f.ProjectFactory()
        services.create_project(workspace=workspace, name="n", description="d", color=2, owner=user)
        fake_project_repository.create_project.assert_called_once()
        fake_project_repository.get_template.assert_called_once()
        fake_project_repository.get_project_role.assert_called_once()
        fake_project_repository.create_membership.assert_called_once()


def test_create_project_with_logo():
    user = f.UserFactory()
    workspace = f.WorkspaceFactory(owner=user)
    logo: UploadFile = valid_image_upload_file

    with patch("taiga.projects.services.projects_repo") as fake_project_repository:
        fake_project_repository.create_project.return_value = f.ProjectFactory()

        services.create_project(workspace=workspace, name="n", description="d", color=2, owner=user, logo=logo)

        service_file_param = fake_project_repository.create_project.call_args_list[0][1]
        assert service_file_param["logo"].name == logo.filename
        assert service_file_param["logo"].file == logo.file


def test_create_project_with_no_logo():
    user = f.UserFactory()
    workspace = f.WorkspaceFactory(owner=user)

    with patch("taiga.projects.services.projects_repo") as fake_project_repository:
        fake_project_repository.create_project.return_value = f.ProjectFactory()
        services.create_project(workspace=workspace, name="n", description="d", color=2, owner=user)

        fake_project_repository.create_project.assert_called_once_with(
            workspace=workspace, name="n", description="d", color=2, owner=user, logo=None
        )


def test_get_project_role():
    with patch("taiga.projects.services.projects_repo") as fake_project_repository:
        fake_project_repository.get_project_role.return_value = f.RoleFactory()
        services.get_project_role(project=f.ProjectFactory(), slug="general-members")
        fake_project_repository.get_project_role.assert_called_once()


def test_update_role_permissions_is_admin():
    with pytest.raises(ex.NonEditableRoleError):
        services.update_role_permissions(role=f.RoleFactory(is_admin=True), permissions=[])


def test_update_role_permissions_incompatible_permissions():
    with pytest.raises(ex.BadPermissionsSetError):
        services.update_role_permissions(
            role=f.RoleFactory(is_admin=False), permissions=["view_tasks", "view_milestones"]
        )


def test_update_role_permissions_ok():
    with patch("taiga.projects.services.projects_repo") as fake_project_repository:
        fake_project_repository.update_role_permissions.return_value = f.RoleFactory()
        services.update_role_permissions(role=f.RoleFactory(), permissions=["view_project", "view_us"])
        fake_project_repository.update_role_permissions.assert_called_once()
