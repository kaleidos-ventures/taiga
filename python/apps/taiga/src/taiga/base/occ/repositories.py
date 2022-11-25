# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any, TypeVar

from taiga.base.db.models import BaseModel, F

_ModelT = TypeVar("_ModelT", bound=BaseModel)


async def update(obj: _ModelT, values: dict[str, Any], protected_attrs: list[str] = []) -> bool:
    updates = dict(values.copy())
    current_version = updates.get("version")
    updates["version"] = F("version") + 1

    # check the version if any of the protected attributes are updated
    if set(protected_attrs).intersection(set(updates.keys())):
        qs = type(obj).objects.filter(id=obj.id, version=current_version)
    else:
        qs = type(obj).objects.filter(id=obj.id)

    num_updates = await qs.aupdate(**updates)

    return num_updates > 0
