#!/usr/bin/env python3
"""Build the static atlas dataset from the explicitly exported Photos album."""

from __future__ import annotations

import argparse
import json
import math
import re
import shutil
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from PIL import ExifTags, Image, ImageOps


IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".heic", ".tif", ".tiff"}
EARTH_RADIUS_KM = 6371.0088
THUMB_IMAGE_MAX_EDGE = 640
THUMB_IMAGE_QUALITY = 78


@dataclass
class Photo:
    source: Path
    taken_at: datetime
    lat: float | None
    lng: float | None


def rational(value: Any) -> float:
    return float(value.numerator) / float(value.denominator) if hasattr(value, "numerator") else float(value)


def dms_to_decimal(values: Any, reference: str) -> float:
    degrees, minutes, seconds = (rational(value) for value in values)
    result = degrees + minutes / 60 + seconds / 3600
    return -result if reference in {"S", "W"} else result


def photo_metadata(path: Path) -> Photo | None:
    try:
        with Image.open(path) as image:
            exif = image.getexif()
            exif_ifd = exif.get_ifd(ExifTags.IFD.Exif)
            gps_ifd = exif.get_ifd(ExifTags.IFD.GPSInfo)
            raw_date = (
                exif_ifd.get(36867)
                or exif_ifd.get(36868)
                or exif.get(306)
            )
            if raw_date:
                taken_at = datetime.strptime(str(raw_date)[:19], "%Y:%m:%d %H:%M:%S")
            else:
                taken_at = datetime.fromtimestamp(path.stat().st_mtime)
            lat = lng = None
            if gps_ifd.get(2) and gps_ifd.get(4):
                lat = dms_to_decimal(gps_ifd[2], str(gps_ifd.get(1, "N")))
                lng = dms_to_decimal(gps_ifd[4], str(gps_ifd.get(3, "E")))
            return Photo(path, taken_at, lat, lng)
    except Exception as error:
        print(f"skip {path.name}: {error}")
        return None


def haversine_km(a_lat: float, a_lng: float, b_lat: float, b_lng: float) -> float:
    lat1, lat2 = math.radians(a_lat), math.radians(b_lat)
    d_lat = lat2 - lat1
    d_lng = math.radians(b_lng - a_lng)
    value = (
        math.sin(d_lat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(d_lng / 2) ** 2
    )
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(value))


def cluster_photos(photos: list[Photo], radius_km: float = 14.0) -> tuple[list[dict[str, Any]], list[Photo]]:
    clusters: list[dict[str, Any]] = []
    located = [photo for photo in photos if photo.lat is not None and photo.lng is not None]
    unlocated = [photo for photo in photos if photo.lat is None or photo.lng is None]

    for photo in sorted(located, key=lambda item: item.taken_at):
        closest: dict[str, Any] | None = None
        closest_distance = float("inf")
        for cluster in clusters:
            distance = haversine_km(photo.lat, photo.lng, cluster["lat"], cluster["lng"])
            if distance < closest_distance:
                closest = cluster
                closest_distance = distance
        if closest is None or closest_distance > radius_km:
            clusters.append({"lat": photo.lat, "lng": photo.lng, "photos": [photo]})
        else:
            closest["photos"].append(photo)
            gps_photos = [
                item for item in closest["photos"] if item.lat is not None and item.lng is not None
            ]
            closest["lat"] = sum(item.lat for item in gps_photos) / len(gps_photos)
            closest["lng"] = sum(item.lng for item in gps_photos) / len(gps_photos)

    still_unlocated: list[Photo] = []
    located_by_time = sorted(located, key=lambda item: item.taken_at)
    for photo in unlocated:
        nearest = min(
            located_by_time,
            key=lambda item: abs((item.taken_at - photo.taken_at).total_seconds()),
            default=None,
        )
        # Camera-only photos often lack GPS. A conservative three-day window keeps
        # them with the closest photographed stop without inventing a new coordinate.
        if nearest and abs((nearest.taken_at - photo.taken_at).total_seconds()) <= 72 * 3600:
            target = min(
                clusters,
                key=lambda cluster: haversine_km(
                    nearest.lat, nearest.lng, cluster["lat"], cluster["lng"]
                ),
            )
            target["photos"].append(photo)
        else:
            still_unlocated.append(photo)

    return clusters, still_unlocated


def reverse_geocode(lat: float, lng: float, cache: dict[str, Any]) -> dict[str, Any]:
    key = f"{lat:.4f},{lng:.4f}"
    if key in cache:
        return cache[key]
    query = urllib.parse.urlencode(
        {
            "lat": f"{lat:.6f}",
            "lon": f"{lng:.6f}",
            "format": "jsonv2",
            "addressdetails": 1,
            "accept-language": "zh-CN,zh,en",
            "zoom": 16,
        }
    )
    request = urllib.request.Request(
        f"https://nominatim.openstreetmap.org/reverse?{query}",
        headers={"User-Agent": "MemoryAtlas/1.0 (private personal photo map)"},
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            result = json.load(response)
    except Exception as error:
        print(f"reverse geocode failed for {key}: {error}")
        result = {"address": {}, "name": ""}
    cache[key] = result
    time.sleep(1.05)
    return result


def place_from_geocode(
    result: dict[str, Any], index: int, lat: float, lng: float
) -> tuple[str, str, str]:
    address = result.get("address") or {}
    city = next(
        (
            address.get(key)
            for key in ("city", "town", "village", "municipality", "county")
            if address.get(key)
        ),
        "",
    )
    detail = next(
        (
            address.get(key)
            for key in (
                "tourism",
                "attraction",
                "amenity",
                "leisure",
                "historic",
                "natural",
                "residential",
            )
            if address.get(key)
        ),
        "",
    )
    if not detail and address.get("city"):
        detail = next(
            (
                address.get(key)
                for key in ("village", "hamlet")
                if address.get(key) and address.get(key) != city
            ),
            "",
        )
    top_name = str(result.get("name") or "").strip()
    osm_class = str(result.get("category") or result.get("class") or "")
    if not detail and top_name and osm_class not in {"place", "boundary", "highway"}:
        detail = top_name
    region = address.get("region") or ""
    if city and detail and detail != city:
        place = f"{city} · {detail}"
    elif region and city and region != city and re.search(r"[区县]$", city):
        place = f"{region} · {city}"
    else:
        place = detail or city or address.get("state") or address.get("country") or f"地点 {index:02d}"

    # These names are present in the Photos album metadata and are more useful
    # than the surrounding administrative district returned by reverse geocoding.
    known_places = (
        ((26.55, 26.66, 106.60, 106.76), "贵阳 · 黔灵山公园"),
        ((26.66, 26.90, 105.75, 106.00), "毕节 · 织金洞景区"),
        ((26.18, 26.36, 105.02, 105.24), "六盘水 · 水城区"),
        ((25.84, 26.05, 105.50, 105.82), "安顺 · 黄果树旅游景区"),
        ((26.43, 26.56, 108.08, 108.26), "黔东南 · 西江千户苗寨"),
        ((29.54, 29.76, 102.82, 103.09), "眉山 · 瓦屋山"),
        ((22.39, 22.66, 114.43, 114.72), "深圳 · 大鹏半岛"),
    )
    for (min_lat, max_lat, min_lng, max_lng), known_name in known_places:
        if min_lat <= lat <= max_lat and min_lng <= lng <= max_lng:
            place = known_name
            break
    province = (
        address.get("state")
        or address.get("province")
        or address.get("region")
        or city
        or address.get("country")
        or "旅途"
    )
    source_text = " ".join(str(value) for value in (place, detail, osm_class, result.get("type", "")))
    if re.search(r"山|湖|海|瀑布|公园|景区|森林|草原|river|park|mount|beach", source_text, re.I):
        tag = "自然"
    elif re.search(r"博物馆|寺|教堂|古|遗址|museum|temple|cathedral|historic", source_text, re.I):
        tag = "人文"
    else:
        tag = "城市"
    return place, province, tag


def approximate_date_label(photos: list[Photo]) -> tuple[str, str]:
    dates = sorted(photo.taken_at for photo in photos)
    first, last = dates[0], dates[-1]
    date = first.strftime("%Y-%m-01")
    if first.year == last.year and first.month == last.month:
        label = f"约 {first.year}年{first.month}月"
    elif first.year == last.year:
        label = f"约 {first.year}年{first.month}月—{last.month}月"
    else:
        label = f"约 {first.year}年—{last.year}年"
    return date, label


def safe_webp(source: Path, destination: Path, max_edge: int, quality: int) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        image.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)
        if image.mode not in {"RGB", "RGBA"}:
            image = image.convert("RGB")
        image.save(destination, "WEBP", quality=quality, method=6)


def ts_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--project", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument(
        "--force-assets",
        action="store_true",
        help="Regenerate optimized images even when output files already exist.",
    )
    args = parser.parse_args()

    source_files = sorted(
        path for path in args.source.iterdir() if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES
    )
    photos = [photo for path in source_files if (photo := photo_metadata(path))]
    print(f"read {len(photos)} photos")
    clusters, unlocated = cluster_photos(photos)
    clusters.sort(key=lambda cluster: min(photo.taken_at for photo in cluster["photos"]), reverse=True)
    print(f"{len(clusters)} mapped places, {len(unlocated)} photos without a reliable location")

    cache_path = args.project / "data" / "geocode-cache.json"
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache = json.loads(cache_path.read_text()) if cache_path.exists() else {}
    assets_root = args.project / "public" / "atlas-photos"
    original_root = assets_root / "original"
    thumb_root = assets_root / "thumb"
    original_root.mkdir(parents=True, exist_ok=True)
    thumb_root.mkdir(parents=True, exist_ok=True)

    memories: list[dict[str, Any]] = []
    for cluster_index, cluster in enumerate(clusters, start=1):
        result = reverse_geocode(cluster["lat"], cluster["lng"], cache)
        place, province, tag = place_from_geocode(
            result, cluster_index, cluster["lat"], cluster["lng"]
        )
        cluster_photos_sorted = sorted(cluster["photos"], key=lambda photo: photo.taken_at)
        image_paths: list[str] = []
        for photo_index, photo in enumerate(cluster_photos_sorted, start=1):
            asset_id = f"p{cluster_index:03d}-{photo_index:03d}"
            original_path = original_root / f"{asset_id}.jpeg"
            thumb_path = thumb_root / f"{asset_id}.webp"
            if args.force_assets or not original_path.exists():
                shutil.copy2(photo.source, original_path)
            if args.force_assets or not thumb_path.exists():
                safe_webp(
                    photo.source,
                    thumb_path,
                    THUMB_IMAGE_MAX_EDGE,
                    THUMB_IMAGE_QUALITY,
                )
            image_paths.append(f"/atlas-photos/original/{asset_id}.jpeg")
        date, date_label = approximate_date_label(cluster_photos_sorted)
        cover_index = min(len(image_paths) // 2, len(image_paths) - 1)
        cover = image_paths[cover_index].replace("/original/", "/thumb/").replace(".jpeg", ".webp")
        memories.append(
            {
                "id": f"place-{cluster_index:03d}",
                "title": place,
                "place": place,
                "province": province,
                "date": date,
                "dateLabel": date_label,
                "note": f"{len(image_paths)} 张照片，按拍摄地点聚合。时间仅保留到大致年月。",
                "image": cover,
                "images": image_paths,
                "lat": round(cluster["lat"], 6),
                "lng": round(cluster["lng"], 6),
                "tag": tag,
            }
        )
        print(f"[{cluster_index}/{len(clusters)}] {place}: {len(image_paths)} photos")
        cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2))

    mapped_photo_count = sum(len(memory["images"]) for memory in memories)
    manual_groups: list[dict[str, Any]] = []
    manual_config_path = args.project / "data" / "manual-location-overrides.json"
    if manual_config_path.exists():
        manual_groups = json.loads(manual_config_path.read_text())

    remaining_unlocated_count = len(unlocated)
    if unlocated:
        unlocated_sorted = sorted(unlocated, key=lambda photo: photo.taken_at)
        image_paths = []
        for photo_index, photo in enumerate(unlocated_sorted, start=1):
            asset_id = f"unmapped-{photo_index:03d}"
            original_path = original_root / f"{asset_id}.jpeg"
            thumb_path = thumb_root / f"{asset_id}.webp"
            if args.force_assets or not original_path.exists():
                shutil.copy2(photo.source, original_path)
            if args.force_assets or not thumb_path.exists():
                safe_webp(
                    photo.source,
                    thumb_path,
                    THUMB_IMAGE_MAX_EDGE,
                    THUMB_IMAGE_QUALITY,
                )
            image_paths.append(f"/atlas-photos/original/{asset_id}.jpeg")

        assigned_indexes: set[int] = set()
        for group in manual_groups:
            indexes = [int(index) for index in group["indexes"]]
            invalid_indexes = [
                index for index in indexes if index < 1 or index > len(image_paths)
            ]
            duplicate_indexes = [index for index in indexes if index in assigned_indexes]
            if invalid_indexes or duplicate_indexes:
                raise ValueError(
                    f"invalid manual indexes for {group['id']}: "
                    f"out_of_range={invalid_indexes}, duplicates={duplicate_indexes}"
                )
            assigned_indexes.update(indexes)
            group_images = [image_paths[index - 1] for index in indexes]
            cover_index = min(len(group_images) // 2, len(group_images) - 1)
            memories.append(
                {
                    "id": group["id"],
                    "title": group["place"],
                    "place": group["place"],
                    "province": group["province"],
                    "date": group["date"],
                    "dateLabel": group["dateLabel"],
                    "note": group["note"],
                    "image": group_images[cover_index]
                    .replace("/original/", "/thumb/")
                    .replace(".jpeg", ".webp"),
                    "images": group_images,
                    "lat": group["lat"],
                    "lng": group["lng"],
                    "tag": group["tag"],
                }
            )

        remaining_indexes = [
            index
            for index in range(1, len(image_paths) + 1)
            if index not in assigned_indexes
        ]
        remaining_unlocated_count = len(remaining_indexes)
        if remaining_indexes:
            remaining_images = [image_paths[index - 1] for index in remaining_indexes]
            cover_index = min(len(remaining_images) // 2, len(remaining_images) - 1)
            memories.append(
                {
                    "id": "place-unmapped",
                    "title": "待确认地点",
                    "place": "待确认地点",
                    "province": "未定位",
                    "date": "2026-01-01",
                    "dateLabel": "时间待确认",
                    "note": f"{len(remaining_images)} 张照片没有可靠的 GPS 信息，先完整保存在这里，不为它们编造坐标。",
                    "image": remaining_images[cover_index]
                    .replace("/original/", "/thumb/")
                    .replace(".jpeg", ".webp"),
                    "images": remaining_images,
                    "lat": 0,
                    "lng": 0,
                    "tag": "人文",
                    "mapped": False,
                }
            )

        mapped_photo_count += len(assigned_indexes)

    output_lines = [
        "export type AlbumMemory = {",
        "  id: string;",
        "  title: string;",
        "  place: string;",
        "  province: string;",
        "  date: string;",
        "  dateLabel: string;",
        "  note: string;",
        "  image: string;",
        "  images: string[];",
        "  lat: number;",
        "  lng: number;",
        '  tag: "城市" | "自然" | "人文";',
        "  mapped?: boolean;",
        "};",
        "",
        "// Generated from the explicitly exported “相册集”.",
        f"export const albumMemories: AlbumMemory[] = {json.dumps(memories, ensure_ascii=False, indent=2)};",
        "",
    ]
    (args.project / "app" / "albumMemories.ts").write_text("\n".join(output_lines))
    report = {
        "exported_files": len(source_files),
        "read_photos": len(photos),
        "mapped_places": len(clusters) + len(manual_groups),
        "unlocated_collections": 1 if remaining_unlocated_count else 0,
        "mapped_photos": mapped_photo_count,
        "published_photos": sum(len(memory["images"]) for memory in memories),
        "unlocated_photos": remaining_unlocated_count,
        "unlocated_files": [
            photo.source.name
            for index, photo in enumerate(sorted(unlocated, key=lambda item: item.taken_at), start=1)
            if not any(index in group["indexes"] for group in manual_groups)
        ],
        "manual_location_groups": len(manual_groups),
    }
    (args.project / "data" / "album-import-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2)
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
