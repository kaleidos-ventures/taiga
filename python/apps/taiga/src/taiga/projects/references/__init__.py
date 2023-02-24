# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from uuid import UUID

from taiga.base.db import exceptions as ex
from taiga.base.db import sequences as seq


def get_project_references_seqname(id: UUID) -> str:
    return f"project_references_{id.hex}"


def create_project_references_sequence(project_id: UUID) -> None:
    seqname = get_project_references_seqname(project_id)
    seq.create(seqname)


def get_new_project_reference_id(project_id: UUID) -> int:
    seqname = get_project_references_seqname(project_id)
    try:
        return seq.next_value(seqname)
    except ex.SequenceDoesNotExist:
        seq.create(seqname)
        return seq.next_value(seqname)


def delete_project_references_sequences(project_ids: list[UUID]) -> None:
    seqnames = [get_project_references_seqname(project_id) for project_id in project_ids]
    seq.delete(seqnames)
