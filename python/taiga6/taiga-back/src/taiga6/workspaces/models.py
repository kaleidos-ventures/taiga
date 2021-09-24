# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import random
import re

from django.conf import settings
from django.db import models
from django.utils.translation import ugettext_lazy as _
from django.template.defaultfilters import slugify
from django.core import validators


MAX_COLORS = 8


class Workspace(models.Model):
    name = models.CharField(max_length=40, null=False, blank=False, verbose_name=_("name"),
                            validators=[validators.RegexValidator(re.compile(r"^[a-zA-Z0-9 \-]+$"),
                                                                  _("Enter a valid name."),"invalid")]
                            )
    slug = models.SlugField(max_length=250, unique=True, null=True, blank=True,
                            verbose_name=_("slug"))
    color = models.IntegerField(default=random.choice(range(1, MAX_COLORS+1)), null=False,
                                blank=False, verbose_name=_("color"))

    created_date = models.DateTimeField(auto_now_add=True, null=False, blank=False,
                                        verbose_name=_("created date"))
    modified_date = models.DateTimeField(auto_now=True, null=False, blank=False,
                                         verbose_name=_("modified date"))

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=False,
        blank=True,
        related_name="owned_workspaces",
        verbose_name=_("owner"),
        on_delete=models.PROTECT,
    )


    class Meta:
        verbose_name = "workspace"
        verbose_name_plural = "workspaces"
        ordering = ["name", "id"]
        index_together = [
            ["name", "id"],
        ]

    def __str__(self):
        return self.name

    def __repr__(self):
        return "<Workspace {0}>".format(self.id)

    def save(self, *args, **kwargs):
        super(Workspace, self).save(*args, **kwargs)
        if not self.slug:
            self.slug = slugify(self.name) + "-" + str(self.id)
            self.save()
