# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.db import models
from taiga.base.utils.datetime import aware_utcnow

#######################################################
# Generic model metadata
#######################################################


class CreatedAtMetaInfoMixin(models.Model):
    created_at = models.DateTimeField(
        null=False,
        blank=False,
        default=aware_utcnow,
        verbose_name="created at",
    )

    class Meta:
        abstract = True


class CreatedByMetaInfoMixin(models.Model):
    created_by = models.ForeignKey(
        "users.User",
        null=False,
        blank=False,
        on_delete=models.SET_NULL,
        verbose_name="created by",
    )

    class Meta:
        abstract = True


class CreatedMetaInfoMixin(CreatedByMetaInfoMixin, CreatedAtMetaInfoMixin):
    class Meta:
        abstract = True


class ModifiedAtMetaInfoMixin(models.Model):
    modified_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="modified at",
    )

    class Meta:
        abstract = True


class DeletedMetaInfoMixin(models.Model):
    deleted_by = models.ForeignKey(
        "users.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name="deleted by",
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="deleted at",
    )

    class Meta:
        abstract = True


#######################################################
# Title
#######################################################


class TitleUpdatedMetaInfoMixin(models.Model):
    title_updated_by = models.ForeignKey(
        "users.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name="title updated by",
    )
    title_updated_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="title updated at",
    )

    class Meta:
        abstract = True


#######################################################
# Description
#######################################################


class DescriptionUpdatedMetaInfoMixin(models.Model):
    description_updated_by = models.ForeignKey(
        "users.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name="description updated by",
    )
    description_updated_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="description updated at",
    )

    class Meta:
        abstract = True
