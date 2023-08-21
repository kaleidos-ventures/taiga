# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import uuid

from django.db import models


def uuid_generator() -> uuid.UUID:
    """uuid.uuid1 wrap function to protect the MAC address."""
    return uuid.uuid1()


class ActiveUser(models.Model):
    """
    In this table we only store activated users.
    """

    id = models.UUIDField(
        primary_key=True, null=False, blank=True, default=uuid_generator, editable=False, verbose_name="ID"
    )
    user_uuid = models.UUIDField(primary_key=False, null=False, blank=False, verbose_name="user uuid")
    activated = models.DateField(null=False, blank=False, verbose_name="activated date")
    active = models.BooleanField(null=False, blank=False, verbose_name="is active user")

    class Meta:
        verbose_name = "users"
        verbose_name_plural = "users"
