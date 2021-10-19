# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


import pytest
from pydantic import ValidationError
from taiga.projects.validators import ProjectValidator


def test_validate_project_with_empty_name(client):
    name = ""
    color = 1

    with pytest.raises(ValidationError, match=r"Empty name is not allowed"):
        ProjectValidator(name=name, color=color)


def test_validate_project_with_long_name(client):
    name = "Project ab c de f gh i jk l mn pw r st u vw x yz ab c de f gh i jk l mn pw r st u vw x yz"
    color = 1

    with pytest.raises(ValidationError, match=r"Name too long"):
        ProjectValidator(name=name, color=color)


def test_validate_project_with_long_description(client):
    name = "Project test"
    description = (
        "Project Lorem ipsum dolor sit amet, consectetuer adipiscing elit."
        "Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus "
        "et magnis dis parturient montes, nascetur ridiculus mus. Donec quam fe"
    )
    color = 1

    with pytest.raises(ValidationError, match=r"Description too long"):
        ProjectValidator(name=name, description=description, color=color)


def test_validate_project_with_invalid_color(client):
    name = "Project test"
    color = 9

    with pytest.raises(ValidationError, match=r"Color not allowed"):
        ProjectValidator(name=name, color=color)


def test_validate_project_with_color_string(client):
    name = "Project test"
    color = "0F0F0F"

    with pytest.raises(ValidationError, match=r"value is not a valid integer"):
        ProjectValidator(name=name, color=color)
