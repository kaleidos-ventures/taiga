# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.base.db import models


class CreatedMetaInfoMixin(models.Model):
    created_at = models.DateTimeField(null=False, blank=False, auto_now_add=True, verbose_name="created at")
    created_by = models.ForeignKey(
        "users.User",
        null=False,
        blank=False,
        on_delete=models.SET_NULL,
        verbose_name="created by",
    )

    class Meta:
        abstract = True
