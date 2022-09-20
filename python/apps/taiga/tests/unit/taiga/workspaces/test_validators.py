# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


import pytest
from pydantic import ValidationError
from taiga.workspaces.workspaces.validators import WorkspaceValidator


def test_validate_workspace_with_empty_name(client):
    name = ""
    color = 1

    with pytest.raises(ValidationError, match=r"Empty name is not allowed"):
        WorkspaceValidator(name=name, color=color)


def test_validate_workspace_with_long_name(client):
    name = "WS ab c de f gh i jk l mn pw r st u vw x yz"
    color = 1

    with pytest.raises(ValidationError, match=r"ensure this value has at most 40 characters"):
        WorkspaceValidator(name=name, color=color)


def test_validate_workspace_with_invalid_color(client):
    name = "WS test"
    color = 9

    with pytest.raises(ValidationError, match=r"ensure this value is less than 9"):
        WorkspaceValidator(name=name, color=color)


def test_validate_workspace_with_color_string(client):
    name = "WS test"
    color = "0F0F0F"

    with pytest.raises(ValidationError, match=r"value is not a valid integer"):
        WorkspaceValidator(name=name, color=color)


def test_validate_workspace_with_valid_data(client):
    name = "WS test"
    color = 1

    data = WorkspaceValidator(name=name, color=color)
    assert data.name == name
    assert data.color == color


def test_validate_workspace_with_blank_chars(client):
    name = "       My w0r#%&乕شspace         "
    color = 1

    data = WorkspaceValidator(name=name, color=color)
    assert data.name == "My w0r#%&乕شspace"
    assert data.color == color
