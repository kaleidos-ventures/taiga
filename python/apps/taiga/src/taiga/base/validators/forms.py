# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import inspect
from typing import Any, Callable, Generator

from fastapi import Form
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from taiga.base.validators.base import BaseModel

CallableGenerator = Generator[Callable[..., Any], None, None]


def as_form(cls: type[BaseModel]) -> type[BaseModel]:
    """
    Adds an as_form class method to decorated models. The as_form class method
    can be used with FastAPI endpoints (https://github.com/tiangolo/fastapi/issues/2387)
    """
    new_params = [
        inspect.Parameter(
            field.alias,
            inspect.Parameter.POSITIONAL_ONLY,
            default=(Form(field.default) if not field.required else Form(None)),
        )
        for field in cls.__fields__.values()
    ]

    async def _as_form(**data):  # type: ignore[no-untyped-def]
        try:
            return cls(**data)
        except ValidationError as e:
            raise RequestValidationError(
                [
                    {
                        "type": i.get("type"),
                        "loc": ("body", i.get("loc")),
                        "msg": i.get("msg"),
                        "input": {},
                        "ctx": {"error": i.get("ctx")},
                    }
                    for i in e.errors()
                ],
                body=e,
            ) from e

    sig = inspect.signature(_as_form)
    sig = sig.replace(parameters=new_params)
    _as_form.__signature__ = sig  # type: ignore[attr-defined]
    setattr(cls, "as_form", _as_form)
    return cls
