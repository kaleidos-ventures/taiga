# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any, Type
from uuid import UUID

from taiga.base.db.models import BaseModel, F


async def update(
    model_class: Type[BaseModel],
    id: UUID,
    values: dict[str, Any] = {},
    current_version: int | None = None,
    protected_attrs: list[str] = [],
) -> bool:
    updates = dict(values.copy())
    updates["version"] = F("version") + 1

    if len(updates) == 1:
        return False  # Nothing to update

    # check the version if any of the protected attributes are updated
    if set(protected_attrs).intersection(set(updates.keys())):
        qs = model_class.objects.filter(id=id, version=current_version)
    else:
        qs = model_class.objects.filter(id=id)

    num_updates = await qs.aupdate(**updates)

    return num_updates > 0
