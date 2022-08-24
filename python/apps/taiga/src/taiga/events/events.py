# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any

from pydantic import Field
from taiga.base.logging.context import get_current_correlation_id
from taiga.base.serializers import BaseModel


class Event(BaseModel):
    type: str
    content: dict[str, Any] | None = None
    correlation_id: str | None = Field(default_factory=get_current_correlation_id)

    def __eq__(self, other: object) -> bool:
        return (
            isinstance(other, Event)
            and self.type == other.type
            and self.correlation_id == other.correlation_id
            and self.content == other.content
        )

    def __repr__(self) -> str:
        return f"Event(type={self.type!r}, correlation_id={self.correlation_id}, content={self.content!r})"

    def __str__(self) -> str:
        return self.json()
