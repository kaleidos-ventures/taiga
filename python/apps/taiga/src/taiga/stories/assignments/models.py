# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.db import models
from taiga.base.db.mixins import CreatedAtMetaInfoMixin


class StoryAssignment(models.BaseModel, CreatedAtMetaInfoMixin):
    user = models.ForeignKey(
        "users.User",
        null=False,
        blank=False,
        related_name="story_assignments",
        on_delete=models.CASCADE,
        verbose_name="user",
    )
    story = models.ForeignKey(
        "stories.Story",
        null=False,
        blank=False,
        related_name="story_assignments",
        on_delete=models.CASCADE,
        verbose_name="story",
    )

    class Meta:
        verbose_name = "story assignment"
        verbose_name_plural = "story assignments"
        constraints = [
            models.UniqueConstraint(fields=["story", "user"], name="%(app_label)s_%(class)s_unique_story_user"),
        ]
        indexes = [
            models.Index(fields=["story", "user"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"User {self.user.username} assigned to story #{self.story.ref}"

    def __repr__(self) -> str:
        return f"<StoryAssignment Story #{self.story.ref} User: {self.user.username}>"
