# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import functools
import uuid
from typing import Type

from asgiref.sync import sync_to_async

# isort: off
from django.db.models import *  # noqa

# isort: on

from django.apps import apps
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation  # noqa
from django.contrib.contenttypes.models import ContentType  # noqa
from django.contrib.postgres.fields import ArrayField, JSONField  # noqa
from django.contrib.postgres.lookups import Unaccent  # noqa
from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector  # noqa
from django.db.models import Model, UUIDField
from django.db.models.functions import Coalesce, Lower, StrIndex, TruncDate  # noqa
from taiga.base.db.models.fields import *  # noqa
from taiga.base.utils.uuid import encode_uuid_to_b64str
from taiga.conf import settings

get_model = apps.get_model


def uuid_generator() -> uuid.UUID:
    """uuid.uuid1 wrap function to protect the MAC address."""
    return uuid.uuid1(node=settings.UUID_NODE)


class BaseModel(Model):
    id = UUIDField(primary_key=True, null=False, blank=True, default=uuid_generator, editable=False, verbose_name="ID")

    class Meta:
        abstract = True

    @functools.cached_property
    def b64id(self) -> str:
        return encode_uuid_to_b64str(self.id)


@sync_to_async
def get_contenttype_for_model(model: Model | Type[Model]) -> ContentType:
    return ContentType.objects.get_for_model(model)
