# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from django.urls import reverse
from django.utils.html import format_html
from taiga.base.db.models import ContentType, Model


def linkify(object: Model, field_name: str) -> str:
    """
    Get an object and a field_name of a ForeignKey or GenericForeignKey field and return a link to the related object.
    """
    linked_obj = getattr(object, field_name)
    linked_content_type = ContentType.objects.get_for_model(linked_obj)
    app_label = linked_content_type.app_label
    model_name = linked_content_type.model
    view_name = f"admin:{app_label}_{model_name}_change"
    link_url = reverse(view_name, args=[linked_obj.pk])
    return format_html('<a href="{}">{}</a>', link_url, linked_obj)
