# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from pydantic import AnyHttpUrl, AnyUrl, BaseConfig
from pydantic.fields import ModelField
from taiga.commons.storage.models import StoragedObject


class StoragedObjectFileField(AnyHttpUrl):
    @classmethod
    def validate(cls, value: StoragedObject, field: ModelField, config: BaseConfig) -> AnyUrl:
        return value.file.url
