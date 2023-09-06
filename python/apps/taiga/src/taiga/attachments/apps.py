# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.django import apps


class AttachmentConfig(apps.AppConfig):
    name = "taiga.attachments"
    label = "attachments"
    verbose_name = "Attachments"

    def ready(self) -> None:
        from taiga.attachments.signals import mark_attachment_file_to_delete
        from taiga.base.db.models import signals

        signals.post_delete.connect(
            mark_attachment_file_to_delete,
            sender="attachments.Attachment",
            dispatch_uid="mark_attachment_file_to_delete",
        )
