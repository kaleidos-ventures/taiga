# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from contextlib import contextmanager
from io import BytesIO
from tempfile import SpooledTemporaryFile
from typing import IO, Generator

from fastapi import UploadFile
from PIL import Image
from taiga.base.utils.files import File

###########################################################
# Binary
###########################################################


@contextmanager
def build_binary_fileio(content: bytes = b"some initial text data") -> Generator[IO[bytes], None, None]:
    file = SpooledTemporaryFile()
    file.write(content)
    file.seek(0)
    yield file
    file.close()


def build_binary_file(
    name: str = "test",
    format: str = "exe",
    content: bytes = b"some initial text data",
) -> File:
    return File(name=f"{name}.{format}", file=BytesIO(content))


def build_binary_uploadfile(
    name: str = "test",
    format: str = "bin",
    content_type: str = "application/octet-stream",
    content: bytes = b"some initial text data",
) -> UploadFile:
    return UploadFile(filename=f"{name}.{format}", content_type=content_type, file=BytesIO(content))


###########################################################
# String
###########################################################


@contextmanager
def build_string_fileio(content: str = "some initial text data") -> IO[bytes]:
    file = SpooledTemporaryFile()
    file.write(content.encode())
    file.seek(0)
    return file
    file.close()


def build_string_file(
    name: str = "test",
    format: str = "txt",
    content: str = "some initial text data",
) -> File:
    return File(name=f"{name}.{format}", file=BytesIO(content.encode()))


def build_string_uploadfile(
    name: str = "test", format: str = "txt", content_type: str = "text/plain", content: str = "some initial text data"
) -> UploadFile:
    return UploadFile(filename=f"{name}.{format}", content_type=content_type, file=BytesIO(content.encode()))


###########################################################
# Images
###########################################################


@contextmanager
def build_image_fileio(format: str = "png") -> Generator[IO[bytes], None, None]:
    file = SpooledTemporaryFile()
    pil_image = Image.new("RGBA", size=(50, 50), color=(155, 0, 0))
    pil_image.save(file, format=format)
    file.seek(0)
    yield file
    file.close()


def build_image_file(
    name: str = "test",
    format: str = "png",
) -> File:
    stream = BytesIO()
    pil_image = Image.new("RGBA", size=(50, 50), color=(155, 0, 0))
    pil_image.save(stream, format=format)
    stream.seek(0)
    return File(name=f"{name}.{format}", file=stream)


def build_image_uploadfile(
    name: str = "test",
    format: str = "png",
    content_type: str = "image/png",
) -> UploadFile:
    stream = BytesIO()
    pil_image = Image.new("RGBA", size=(50, 50), color=(155, 0, 0))
    pil_image.save(stream, format=format)
    stream.seek(0)
    return UploadFile(filename=f"{name}.{format}", content_type=content_type, file=stream)
