# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any

from taiga.base.serializers import BaseModel


class Event(BaseModel):
    type: str
    sender: str | None = None
    content: dict[str, Any] | None = None

    def __eq__(self, other: object) -> bool:
        return (
            isinstance(other, Event)
            and self.type == other.type
            and self.sender == other.sender
            and self.content == other.content
        )

    def __repr__(self) -> str:
        return f"Event(type={self.type!r}, sender={self.sender!r}, content={self.content!r})"

    def __str__(self) -> str:
        return self.json()
