# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from uuid import UUID

import pytest
from pydantic import ValidationError
from taiga.projects.projects.api.validators import ProjectValidator, UpdateProjectValidator
from tests.unit.utils import check_validation_errors
from tests.utils import factories as f

##########################################################
# ProjectValidator
##########################################################


def test_validate_create_user_wrong_not_all_required_fields():
    with pytest.raises(ValidationError) as validation_errors:
        ProjectValidator()

    expected_error_fields = ["name", "workspaceId"]
    expected_error_messages = ["field required"]
    check_validation_errors(validation_errors, expected_error_fields, expected_error_messages)


def test_validate_project_with_empty_name():
    name = ""
    color = 1

    with pytest.raises(ValidationError, match=r"Empty name is not allowed"):
        ProjectValidator(name=name, color=color)


def test_validate_project_with_long_name():
    name = "Project ab c de f gh i jk l mn pw r st u vw x yz ab c de f gh i jk l mn pw r st u vw x yz"
    color = 1
    workspace_id = "6JgsbGyoEe2VExhWgGrI2w"
    with pytest.raises(ValidationError, match=r"ensure this value has at most 80 characters"):
        ProjectValidator(name=name, color=color, workspace_id=workspace_id)


def test_validate_project_with_long_description():
    name = "Project test"
    description = (
        "Project Lorem ipsum dolor sit amet, consectetuer adipiscing elit."
        "Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus "
        "et magnis dis parturient montes, nascetur ridiculus mus. Donec quam fe "
        "aenean massa. Cum sociis natoque penatibus"
    )
    color = 1
    workspace_id = "6JgsbGyoEe2VExhWgGrI2w"

    with pytest.raises(ValidationError, match=r"ensure this value has at most 220 characters"):
        ProjectValidator(name=name, description=description, color=color, workspace_id=workspace_id)


def test_validate_project_with_invalid_color():
    name = "Project test"
    color = 9
    workspace_id = "6JgsbGyoEe2VExhWgGrI2w"

    with pytest.raises(ValidationError, match=r"ensure this value is less than 9"):
        ProjectValidator(name=name, color=color, workspace_id=workspace_id)


def test_valid_project():
    name = "Project test"
    workspace_b64id = "6JgsbGyoEe2VExhWgGrI2w"
    workspace_UUIDid = UUID("e8982c6c-6ca8-11ed-9513-1856806ac8db")
    color = 1

    project = ProjectValidator(workspace_id=workspace_b64id, name=name, color=color)

    assert project.name == name
    assert project.workspace_id == workspace_UUIDid
    assert project.color == color


def test_validate_logo_content_type():
    name = "Project test"
    color = 1
    logo = f.build_string_uploadfile()

    with pytest.raises(ValidationError) as validations_errors:
        ProjectValidator(name=name, color=color, logo=logo)

    expected_error_fields = [
        "logo",
        "workspaceId",
    ]
    expected_error_messages = ["Invalid image format", "field required"]
    check_validation_errors(validations_errors, expected_error_fields, expected_error_messages)


def test_validate_logo_content():
    name = "Project test"
    color = 1
    logo = f.build_string_uploadfile()
    logo.content_type = "image/png"

    with pytest.raises(ValidationError) as validations_errors:
        ProjectValidator(name=name, color=color, logo=logo)

    expected_error_fields = ["logo", "workspaceId"]
    expected_error_messages = ["Invalid image content", "field required"]
    check_validation_errors(validations_errors, expected_error_fields, expected_error_messages)


##########################################################
# UpdateProjectValidator
##########################################################


def test_validate_update_project_ok():
    name = "new name"
    description = "new description"
    patch = UpdateProjectValidator(name=name, description=description)

    assert patch.name == name
    assert patch.description == description
    assert patch.logo is None
