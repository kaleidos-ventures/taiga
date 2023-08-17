# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any, Callable, Generator, Type

from fastapi import UploadFile as FastAPIUploadFile
from pydantic import PydanticValueError
from taiga.base.utils.files import get_size
from taiga.conf import settings

CallableGenerator = Generator[Callable[..., Any], None, None]


class MaxFileSizeExcededError(PydanticValueError):
    code = "file.max_size_exceeded"
    msg_template = "Maximum file size exceeded (max allowed: {max_size} Bytes)"

    def __init__(self, *, max_size: int) -> None:
        super().__init__(max_size=max_size)


class MaxFileSizeValidator:
    def __init__(self, max_size: int):
        self.max_size = max_size

    def __call__(self, file: FastAPIUploadFile) -> FastAPIUploadFile:
        if get_size(file.file) > self.max_size:
            raise MaxFileSizeExcededError(max_size=self.max_size)
        return file


class UploadFile(FastAPIUploadFile):
    custom_validators = [
        MaxFileSizeValidator(max_size=settings.MAX_UPLOAD_FILE_SIZE),
    ]

    @classmethod
    def __get_validators__(cls: Type["UploadFile"]) -> CallableGenerator:
        yield cls.validate

        for validator in cls.custom_validators:
            yield validator
