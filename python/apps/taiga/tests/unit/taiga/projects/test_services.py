# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

import pytest
from fastapi import UploadFile
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
