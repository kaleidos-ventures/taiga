# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any

from humps.main import camelize
from pydantic import BaseModel as _BaseModel
from taiga.base.api import AuthRequest


class BaseModel(_BaseModel):
    async def cleaned_dict(self, request: AuthRequest) -> dict[str, Any]:
        """
        This method chooses the valid fields from the form. Used in PATCH endpoints for instance.
        Pydantic forms always fill all the fields, even with None. In a PATCH we need to distinguish between:
        a) no data: means the original value stays
        b) data with None: means delete de value
        This method reads the fields in the request.form and filter them from the Pytantic form
        """
        keys = (await request.form()).keys()
        return {k: v for k, v in self.dict().items() if k in keys}

    class Config:
        alias_generator = camelize
        allow_population_by_field_name = True
        extra = "forbid"
