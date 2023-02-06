# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from uuid import uuid1

import pytest
from taiga.base.db import sequences as seq
from taiga.projects import references as refs

pytestmark = pytest.mark.django_db


def test_get_project_references_seqname():
    project1_id = uuid1()
    project2_id = uuid1()

    seqname1 = refs.get_project_references_seqname(project1_id)
    seqname2 = refs.get_project_references_seqname(project2_id)

    assert project1_id.hex in seqname1
    assert project2_id.hex in seqname2


def test_create_project_references_sequence():
    project1_id = uuid1()
    project2_id = uuid1()

    refs.create_project_references_sequence(project1_id)
    refs.create_project_references_sequence(project2_id)

    assert refs.get_new_project_reference_id(project1_id) == 1
    assert refs.get_new_project_reference_id(project2_id) == 1
    assert refs.get_new_project_reference_id(project2_id) == 2

    refs.create_project_references_sequence(project1_id)  # do nothing
    refs.create_project_references_sequence(project2_id)  # do nothing

    assert refs.get_new_project_reference_id(project2_id) == 3
    assert refs.get_new_project_reference_id(project1_id) == 2


def test_get_new_project_reference_id_if_sequence_does_not_exist():
    project_id = uuid1()
    seqname = refs.get_project_references_seqname(project_id)

    assert not seq.exists(seqname)
    assert refs.get_new_project_reference_id(project_id) == 1
    assert seq.exists(seqname)


def test_delete_project_references_sequence():
    project_id = uuid1()

    refs.create_project_references_sequence(project_id)

    refs.delete_project_references_sequences([project_id])
    assert not seq.exists(refs.get_project_references_seqname(project_id))
