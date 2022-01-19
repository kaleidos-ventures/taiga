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
    workspace = f.WorkspaceFactory()

    with patch("taiga.projects.services.projects_repo") as fake_project_repository, patch(
        "taiga.projects.services.roles_repo"
    ) as fake_role_repository, patch("taiga.projects.services.roles_services") as fake_role_services:
        fake_project_repository.create_project.return_value = f.ProjectFactory()

        services.create_project(workspace=workspace, name="n", description="d", color=2, owner=workspace.owner)

        fake_project_repository.create_project.assert_called_once()
        fake_project_repository.get_template.assert_called_once()
        fake_role_services.get_project_role.assert_called_once()
        fake_role_repository.create_membership.assert_called_once()


def test_create_project_with_logo():
    workspace = f.WorkspaceFactory()
    logo: UploadFile = valid_image_upload_file

    with patch("taiga.projects.services.projects_repo") as fake_project_repository, patch(
        "taiga.projects.services.roles_repo"
    ):
        fake_project_repository.create_project.return_value = f.ProjectFactory()

        services.create_project(
            workspace=workspace, name="n", description="d", color=2, owner=workspace.owner, logo=logo
        )

        service_file_param = fake_project_repository.create_project.call_args_list[0][1]
        assert service_file_param["logo"].name == logo.filename
        assert service_file_param["logo"].file == logo.file


def test_create_project_with_no_logo():
    workspace = f.WorkspaceFactory()

    with patch("taiga.projects.services.projects_repo") as fake_project_repository, patch(
        "taiga.projects.services.roles_repo"
    ):
        fake_project_repository.create_project.return_value = f.ProjectFactory()
        services.create_project(workspace=workspace, name="n", description="d", color=2, owner=workspace.owner)

        fake_project_repository.create_project.assert_called_once_with(
            workspace=workspace, name="n", description="d", color=2, owner=workspace.owner, logo=None
        )


def test_update_project_public_permissions_ok():
    project = f.ProjectFactory()
    permissions = ["view_project", "view_milestones", "add_us", "view_us", "modify_task", "view_tasks"]
    anon_permissions = ["view_project", "view_milestones", "view_us", "view_tasks"]

    with patch("taiga.projects.services.projects_repo") as fake_project_repository:
        services.update_project_public_permissions(project=project, permissions=permissions)
        assert fake_project_repository.called_once_with(project, permissions, anon_permissions)


def test_update_project_public_permissions_not_valid():
    project = f.ProjectFactory()
    not_valid_permissions = ["invalid_permission", "other_not_valid", "add_us"]

    with pytest.raises(ex.NotValidPermissionsSetError):
        services.update_project_public_permissions(project=project, permissions=not_valid_permissions)


def test_update_project_public_permissions_incompatible():
    project = f.ProjectFactory()
    incompatible_permissions = ["view_tasks", "view_milestones"]

    with pytest.raises(ex.IncompatiblePermissionsSetError):
        services.update_project_public_permissions(project=project, permissions=incompatible_permissions)
