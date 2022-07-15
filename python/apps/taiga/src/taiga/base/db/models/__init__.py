# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import uuid

# isort: off
from django.db.models import *  # noqa

# isort: on

from django.apps import apps
from django.contrib.contenttypes.fields import GenericForeignKey  # noqa
from django.contrib.contenttypes.models import ContentType  # noqa
from django.contrib.postgres.fields import ArrayField, JSONField  # noqa
from django.contrib.postgres.lookups import Unaccent  # noqa
from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector  # noqa
from django.core.files import File  # noqa
from django.db.models import Model, UUIDField
from django.db.models.functions import Lower, StrIndex  # noqa
from taiga.base.db.models.fields import *  # noqa
from taiga.conf import settings

get_model = apps.get_model


def uuid_generator() -> uuid.UUID:
    """uuid.uuid1 wrap function to protect the MAC address."""
    return uuid.uuid1(node=settings.UUID_NODE)


class BaseModel(Model):
    id = UUIDField(primary_key=True, null=False, blank=True, default=uuid_generator, editable=False, verbose_name="ID")

    class Meta:
        abstract = True
