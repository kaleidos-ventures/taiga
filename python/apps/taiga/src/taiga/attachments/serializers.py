# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from datetime import datetime

from taiga.base.serializers import UUIDB64, BaseModel
from taiga.commons.storage.serializers import StoragedObjectFileField


class AttachmentSerializer(BaseModel):
    id: UUIDB64
    name: str
    content_type: str
    size: int
    created_at: datetime
    file: StoragedObjectFileField

    class Config:
        orm_mode = True
