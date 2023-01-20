# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


from pydantic import validator
from taiga.base.validators import BaseModel


class PermissionsValidator(BaseModel):
    permissions: list[str]

    @validator("permissions")
    def check_view_project_permissions(cls, v: list[str]) -> list[str]:
        assert "view_project" in v, "Must have at least view_project permission"
        return v
