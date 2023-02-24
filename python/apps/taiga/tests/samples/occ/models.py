# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.db import models
from taiga.base.occ.models import VersionedMixin


class SampleOCCItem(models.BaseModel, VersionedMixin):
    name = models.CharField(max_length=80, null=False, blank=False)
    description = models.CharField(max_length=220, null=True, blank=True)
    is_active = models.BooleanField(default=True, null=False, blank=False)
