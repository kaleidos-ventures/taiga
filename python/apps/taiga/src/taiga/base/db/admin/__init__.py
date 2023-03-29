# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import TypeVar

from django.contrib.admin import ModelAdmin as DjangoModelAdmin
from django.contrib.admin import StackedInline as DjangoStackedInline
from django.contrib.admin import TabularInline as DjangoTabularInline
from django.contrib.admin import display, register, site  # noqa
from django.contrib.contenttypes.admin import GenericStackedInline, GenericTabularInline  # noqa
from nonrelated_inlines.admin import NonrelatedTabularInline  # type: ignore  # noqa
from taiga.base.db.admin.forms import PrettyJSONWidget
from taiga.base.db.models import JSONField, Model

_ModelT = TypeVar("_ModelT", bound=Model)
_ChildModelT = TypeVar("_ChildModelT", bound=Model)
_ParentModelT = TypeVar("_ParentModelT", bound=Model)


class ModelAdmin(DjangoModelAdmin[_ModelT]):
    formfield_overrides = {JSONField: {"widget": PrettyJSONWidget}}


class StackedInline(DjangoStackedInline[_ChildModelT, _ParentModelT]):
    formfield_overrides = {JSONField: {"widget": PrettyJSONWidget}}


class TabularInline(DjangoTabularInline[_ChildModelT, _ParentModelT]):
    formfield_overrides = {JSONField: {"widget": PrettyJSONWidget}}
