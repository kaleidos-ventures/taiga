# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any

from taiga.attachments.models import Attachment
from taiga.base.db.models import Model
from taiga.commons.storage import repositories as storage_repositories


def mark_attachment_file_to_delete(sender: Model, instance: Attachment, **kwargs: Any) -> None:
    """
    Mark the store object (with the file) of the attachment as deleted.
    """
    storage_repositories.mark_storaged_object_as_deleted(storaged_object=instance.file)
