# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import hashlib
import io
from os import path, urandom
from typing import IO, Any, Generator

from django.core.files.base import File as DjangoFile
from django.db.models.fields.files import FieldFile  # noqa
from fastapi import UploadFile
from taiga.base.utils.datetime import aware_utcnow
from taiga.base.utils.iterators import split_by_n
from taiga.base.utils.slug import slugify

File = DjangoFile[bytes]


def uploadfile_to_file(file: UploadFile) -> File:
    """
    Convert an `fastapi.UploadFile` object to a `File` object. Useful to the ORM.

    :param file: a uploaded file object
    :type file: fastapi.UploadFile
    :return a file object
    :rtype File
    """
    return File(name=file.filename, file=file.file)


def iterfile(file: File, mode: str | None = "rb") -> Generator[bytes, None, None]:
    """
    Function to iterate over the content of a Django File object.
    This function is useful to iterate over the content of a file so you can stream it.

    :param file: a Django File object
    :type file: File
    :param mode: the mode to open the file
    :type mode: str | None
    :return a generator
    :rtype Generator[bytes, None, None]
    """
    with file.open(mode) as f:
        yield from f


def get_size(file: IO[Any]) -> int:
    """
    Calculate the current size of a file in bytes.

    :param file: any object that satisfy the typing.IO interface
    :type file: typing.IO
    :return the size in bytes
    :rtype int
    """
    current = file.tell()
    size = file.seek(0, io.SEEK_END)
    file.seek(current)
    return size


def normailize_filename(filename: str) -> str:
    """
    Normalize a filename. It will be

      - in lowercase
      - slugified
      - with no more than 100 characters

    :param filename: a filename
    :type filename: str
    :return a normalized filename
    :rtype str
    """
    base, ext = path.splitext(path.basename(filename).lower())
    base = slugify(base)[0:100]
    return f"{base}{ext}"


def get_obfuscated_file_path(instance: Any, filename: str, base_path: str = "") -> str:
    """
    Generates a path for a file by obfuscating it, using a hash as the name of the directory
    in which it will be stored.

    NOTE: This function is useful for use in a Dajngo model with FileField or ImageField to
    define the upload_to attribute.

    :param instance: a Django Model instance
    :type instance: Any
    :param filename: a filename
    :type filename: str
    :param base_path: an optional base path
    :type base_path: str
    :return an obfuscated path
    :rtype str
    """
    basename = normailize_filename(filename)

    hs = hashlib.sha256()
    hs.update(aware_utcnow().isoformat().encode("utf-8", "strict"))
    hs.update(urandom(1024))

    p1, p2, p3, p4, *p5 = split_by_n(hs.hexdigest(), 1)
    hash_part = path.join(p1, p2, p3, p4, "".join(p5))

    return path.join(base_path, hash_part, basename)
