from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import settings


@dataclass(frozen=True)
class StoredObject:
    storage_path: str
    public_url: str | None = None


@dataclass(frozen=True)
class StorageAccess:
    url: str
    expires_in_seconds: int
    access_type: str


def safe_suffix(filename: str | None) -> str:
    suffix = Path(filename or "upload.bin").suffix.lower()
    if not suffix or len(suffix) > 12:
        return ".bin"
    return suffix


async def store_upload(user_id: str, file: UploadFile, photo_type: str) -> StoredObject:
    key = f"{photo_type}/{user_id}/{uuid4()}{safe_suffix(file.filename)}"
    content = await file.read()
    if settings.storage_backend == "s3":
        return store_s3_object(key, content, file.content_type)
    return store_local_object(key, content)


def store_local_object(key: str, content: bytes) -> StoredObject:
    root = Path(settings.storage_local_root)
    path = root / key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)
    return StoredObject(storage_path=str(path))


def store_s3_object(key: str, content: bytes, content_type: str | None) -> StoredObject:
    if not settings.storage_bucket:
        raise RuntimeError("STORAGE_BUCKET is required for s3 storage")
    if not settings.storage_access_key or not settings.storage_secret_key:
        raise RuntimeError("STORAGE_ACCESS_KEY and STORAGE_SECRET_KEY are required for s3 storage")

    import boto3

    client = boto3.client(
        "s3",
        endpoint_url=settings.storage_endpoint,
        aws_access_key_id=settings.storage_access_key,
        aws_secret_access_key=settings.storage_secret_key,
    )
    extra_args = {"ContentType": content_type or "application/octet-stream"}
    client.put_object(Bucket=settings.storage_bucket, Key=key, Body=content, **extra_args)
    public_url = f"{settings.storage_public_base_url.rstrip('/')}/{key}" if settings.storage_public_base_url else None
    return StoredObject(storage_path=f"s3://{settings.storage_bucket}/{key}", public_url=public_url)


def parse_s3_path(storage_path: str) -> tuple[str, str] | None:
    parsed = urlparse(storage_path)
    bucket = parsed.netloc
    key = parsed.path.lstrip("/")
    if not bucket or not key:
        return None
    return bucket, key


def s3_client():
    if not settings.storage_access_key or not settings.storage_secret_key:
        raise RuntimeError("STORAGE_ACCESS_KEY and STORAGE_SECRET_KEY are required for s3 storage access")
    import boto3

    return boto3.client(
        "s3",
        endpoint_url=settings.storage_endpoint,
        aws_access_key_id=settings.storage_access_key,
        aws_secret_access_key=settings.storage_secret_key,
    )


def resolve_local_storage_path(storage_path: str) -> Path | None:
    if storage_path.startswith("s3://"):
        return None
    root = Path(settings.storage_local_root)
    if not root.is_absolute():
        root = Path.cwd() / root
    candidate = Path(storage_path)
    if not candidate.is_absolute():
        candidate = Path.cwd() / candidate
    root = root.resolve()
    candidate = candidate.resolve()
    try:
        candidate.relative_to(root)
    except ValueError:
        return None
    if not candidate.exists() or not candidate.is_file():
        return None
    return candidate


def create_storage_access(storage_path: str, local_url: str, expires_in_seconds: int = 900) -> StorageAccess:
    if storage_path.startswith("s3://"):
        parsed = parse_s3_path(storage_path)
        if not parsed:
            raise RuntimeError("Invalid S3 storage path")
        bucket, key = parsed
        url = s3_client().generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expires_in_seconds,
        )
        return StorageAccess(url=url, expires_in_seconds=expires_in_seconds, access_type="presigned_url")
    if not resolve_local_storage_path(storage_path):
        raise FileNotFoundError("Stored object not found")
    return StorageAccess(url=local_url, expires_in_seconds=expires_in_seconds, access_type="backend_stream")


def delete_stored_object(storage_path: str) -> bool:
    if storage_path.startswith("s3://"):
        parsed = parse_s3_path(storage_path)
        if not parsed:
            return False
        bucket, key = parsed
        try:
            client = s3_client()
        except RuntimeError:
            return False
        client.delete_object(Bucket=bucket, Key=key)
        return True
    path = resolve_local_storage_path(storage_path)
    if path:
        path.unlink()
        return True
    return False
