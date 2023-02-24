# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from pydantic import ConstrainedStr, conint
from taiga.base.validators import BaseModel


class Name(ConstrainedStr):
    strip_whitespace = True
    min_length = 1
    max_length = 40


class WorkspaceValidator(BaseModel):
    name: Name
    color: conint(gt=0, lt=9)  # type: ignore


class UpdateWorkspaceValidator(BaseModel):
    name: Name | None
