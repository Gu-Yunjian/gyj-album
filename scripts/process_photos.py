#!/usr/bin/env python3
"""
图片处理脚本 - 支持影集结构
- 扫描 originals/ 下的子目录作为影集
- 压缩原图为 WebP（主图 ≤1MB，缩略图 ≤200KB）
- 提取 EXIF 信息
- 生成 albums.json 元数据
"""

import os
import sys
import json
import shutil
from pathlib import Path
from PIL import Image, ImageOps
import piexif

# 配置
ORIGINALS_DIR = Path("originals")
PHOTOS_DIR = Path("public/photos")
MEDIUM_DIR = Path("public/medium")  # 中等尺寸图片（首页用）
THUMBNAILS_DIR = Path("public/thumbnails")
METADATA_FILE = Path("public/albums.json")

# 压缩参数
MAX_MAIN_SIZE = 900 * 1024      # 900KB - 主图（灯箱用）
MAX_MEDIUM_SIZE = 400 * 1024    # 400KB - 中图（首页瀑布流用）
MAX_THUMB_SIZE = 150 * 1024     # 150KB - 缩略图（影集页用）
MAIN_QUALITY = 85
MEDIUM_QUALITY = 80
THUMB_QUALITY = 70
MEDIUM_MAX_DIMENSION = 800      # 中图最大边 800px
THUMB_MAX_DIMENSION = 400       # 缩略图最大边 400px


def get_exif_data(image_path):
    """提取 EXIF 信息"""
    try:
        image = Image.open(image_path)
        exif_dict = piexif.load(image.info.get('exif', b''))
        
        exif_data = {}
        
        # 提取光圈
        if piexif.ExifIFD.FNumber in exif_dict.get('Exif', {}):
            fnumber = exif_dict['Exif'][piexif.ExifIFD.FNumber]
            if isinstance(fnumber, tuple):
                exif_data['aperture'] = f"f/{fnumber[0] / fnumber[1]:.1f}"
        
        # 提取快门速度
        if piexif.ExifIFD.ExposureTime in exif_dict.get('Exif', {}):
            exposure = exif_dict['Exif'][piexif.ExifIFD.ExposureTime]
            if isinstance(exposure, tuple):
                numerator, denominator = exposure
                if numerator >= denominator:
                    exif_data['shutterSpeed'] = f'{numerator // denominator}"'
                else:
                    exif_data['shutterSpeed'] = f"1/{int(denominator/numerator)}s"
        
        # 提取 ISO
        if piexif.ExifIFD.ISOSpeedRatings in exif_dict.get('Exif', {}):
            iso = exif_dict['Exif'][piexif.ExifIFD.ISOSpeedRatings]
            if isinstance(iso, tuple):
                exif_data['iso'] = iso[0]
            else:
                exif_data['iso'] = iso
        
        # 提取拍摄时间
        if piexif.ExifIFD.DateTimeOriginal in exif_dict.get('Exif', {}):
            date_str = exif_dict['Exif'][piexif.ExifIFD.DateTimeOriginal].decode('utf-8', errors='ignore')
            exif_data['dateTaken'] = date_str
        
        # 提取相机型号
        if piexif.ImageIFD.Model in exif_dict.get('0th', {}):
            model = exif_dict['0th'][piexif.ImageIFD.Model].decode('utf-8', errors='ignore').strip()
            exif_data['camera'] = model
        
        return exif_data if exif_data else None
        
    except Exception as e:
        print(f"  Warning: Cannot extract EXIF: {e}")
        return None


def compress_image(input_path, output_path, max_size, quality, size_type='main'):
    """压缩图片到指定大小以内
    size_type: 'main' | 'medium' | 'thumbnail'
    """
    try:
        img = Image.open(input_path)

        # 处理 EXIF 方向（手机拍摄的竖图需要旋转）
        try:
            exif = img.getexif()
            if exif:
                orientation = exif.get(0x0112)  # Orientation tag
                if orientation:
                    img = ImageOps.exif_transpose(img)
        except Exception:
            pass  # 如果 EXIF 处理失败，继续使用原图

        # 转换为 RGB
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # 根据类型调整尺寸
        if size_type == 'thumbnail':
            # 缩略图：缩小到 400px
            img.thumbnail((THUMB_MAX_DIMENSION, THUMB_MAX_DIMENSION), Image.LANCZOS)
        elif size_type == 'medium':
            # 中图：缩小到 800px
            img.thumbnail((MEDIUM_MAX_DIMENSION, MEDIUM_MAX_DIMENSION), Image.LANCZOS)
        else:
            # 主图：如果文件太大，适当缩小
            file_size = input_path.stat().st_size
            if file_size > max_size * 2:
                scale = min(1.0, (max_size * 2 / file_size) ** 0.5)
                new_size = (int(img.width * scale), int(img.height * scale))
                img = img.resize(new_size, Image.LANCZOS)
        
        # 直接保存，使用指定质量
        from io import BytesIO
        buffer = BytesIO()
        img.save(buffer, format='WEBP', quality=quality, method=4)
        size = buffer.tell()
        
        # 如果还是太大，降低质量重试
        if size > max_size:
            buffer = BytesIO()
            img.save(buffer, format='WEBP', quality=max(50, quality - 15), method=4)
            size = buffer.tell()
        
        # 如果还是太大，进一步缩小图片（仅主图和中图）
        if size > max_size and size_type != 'thumbnail':
            img.thumbnail((img.width // 2, img.height // 2), Image.LANCZOS)
            buffer = BytesIO()
            img.save(buffer, format='WEBP', quality=max(40, quality - 20), method=4)
            size = buffer.tell()
        
        # 保存结果
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(buffer.getvalue())
        return True, size
            
    except Exception as e:
        print(f"  Error: Compression failed: {e}")
        return False, 0


def scan_albums():
    """扫描 originals/ 目录下的所有影集"""
    albums = []
    
    if not ORIGINALS_DIR.exists():
        print(f"[Error] Originals directory not found: {ORIGINALS_DIR}")
        return albums
    
    # 扫描子目录作为影集
    for item in ORIGINALS_DIR.iterdir():
        if item.is_dir():
            album_name = item.name
            photos = []
            for ext in ['*.jpg', '*.jpeg', '*.png', '*.webp', '*.JPG', '*.JPEG', '*.PNG', '*.WEBP']:
                photos.extend(item.glob(ext))
            
            if photos:
                albums.append({
                    'name': album_name,
                    'path': item,
                    'photos': sorted(photos)
                })
    
    # 扫描根目录下的照片作为默认影集
    root_photos = []
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.webp', '*.JPG', '*.JPEG', '*.PNG', '*.WEBP']:
        root_photos.extend(ORIGINALS_DIR.glob(ext))
    
    if root_photos:
        albums.append({
            'name': 'default',
            'path': ORIGINALS_DIR,
            'photos': sorted(root_photos)
        })
    
    return albums


def process_albums():
    """主处理函数"""
    print("=" * 60)
    print("[Photo] Starting album processing...")
    print("=" * 60)
    
    # 扫描影集
    albums = scan_albums()
    
    if not albums:
        print("[Error] No albums found in originals/")
        return False
    
    print(f"[Info] Found {len(albums)} album(s)")
    
    # 加载现有元数据
    albums_data = {"albums": [], "allPhotos": {}}
    if METADATA_FILE.exists():
        try:
            with open(METADATA_FILE, 'r', encoding='utf-8') as f:
                albums_data = json.load(f)
            print(f"[Info] Loaded existing metadata")
        except:
            albums_data = {"albums": [], "allPhotos": {}}
    
    # 处理每个影集
    updated_albums = []
    all_photos = {}
    total_processed = 0
    total_skipped = 0
    
    for album_info in albums:
        album_name = album_info['name']
        album_path = album_info['path']
        photo_files = album_info['photos']
        
        print(f"\n[Album] Processing: {album_name} ({len(photo_files)} photos)")
        
        # 查找或创建影集信息
        existing_album = None
        for a in albums_data.get("albums", []):
            if a["name"] == album_name:
                existing_album = a
                break
        
        if existing_album:
            album_meta = existing_album
        else:
            # 新影集，创建默认信息
            album_meta = {
                "name": album_name,
                "title": album_name,
                "subtitle": "",
                "cover": "",
                "photos": [],
                "photoInfos": {},
                "hasBgm": False
            }
        
        album_photos = []
        photo_infos = album_meta.get("photoInfos", {})
        
        processed_stems = set()  # 追踪已处理的照片
        
        for orig_path in photo_files:
            stem = orig_path.stem
            
            # 跳过重复的文件名
            if stem in processed_stems:
                continue
            processed_stems.add(stem)
            
            output_name = f"{stem}.webp"
            
            main_path = PHOTOS_DIR / album_name / output_name
            medium_path = MEDIUM_DIR / album_name / output_name
            thumb_path = THUMBNAILS_DIR / album_name / output_name
            
            album_photos.append(output_name)
            
            # 检查是否需要更新
            needs_update = (
                not main_path.exists() or 
                not medium_path.exists() or
                not thumb_path.exists() or
                orig_path.stat().st_mtime > main_path.stat().st_mtime
            )
            
            if not needs_update:
                print(f"  [Skip] {orig_path.name}")
                total_skipped += 1
                # 从已有数据获取大小
                key = f"{album_name}/{stem}"
                if key in albums_data.get("allPhotos", {}):
                    all_photos[key] = albums_data["allPhotos"][key]
                continue
            
            print(f"  [Process] {orig_path.name}")
            
            # 提取 EXIF
            exif_data = get_exif_data(orig_path)
            
            # 压缩主图
            print(f"    Compressing main image...", end='')
            success, main_size = compress_image(
                orig_path, main_path, MAX_MAIN_SIZE, MAIN_QUALITY
            )
            if success:
                print(f" OK {main_size / 1024:.1f}KB")
            else:
                print(f" Failed")
                continue
            
            # 生成中图（首页用）
            print(f"    Generating medium...", end='')
            success, medium_size = compress_image(
                orig_path, medium_path, MAX_MEDIUM_SIZE, MEDIUM_QUALITY, size_type='medium'
            )
            if success:
                print(f" OK {medium_size / 1024:.1f}KB")
            else:
                print(f" Warning: Using main image as medium")
                shutil.copy(main_path, medium_path)
                medium_size = main_size
            
            # 生成缩略图
            print(f"    Generating thumbnail...", end='')
            success, thumb_size = compress_image(
                orig_path, thumb_path, MAX_THUMB_SIZE, THUMB_QUALITY, size_type='thumbnail'
            )
            if success:
                print(f" OK {thumb_size / 1024:.1f}KB")
            else:
                print(f" Warning: Using main image as thumbnail")
                shutil.copy(medium_path, thumb_path)
                thumb_size = medium_size
            
            # 更新照片数据
            key = f"{album_name}/{stem}"
            all_photos[key] = {
                "filename": output_name,
                "originalName": orig_path.name,
                "mainSize": main_size,
                "mediumSize": medium_size,
                "thumbSize": thumb_size,
                "exif": exif_data or {}
            }
            
            total_processed += 1
        
        # 更新影集元数据
        album_meta["photos"] = album_photos
        album_meta["photoInfos"] = photo_infos
        if album_photos and not album_meta["cover"]:
            album_meta["cover"] = album_photos[0]
        
        updated_albums.append(album_meta)
    
    # 清理已删除的照片
    current_keys = set()
    for album in updated_albums:
        for photo in album["photos"]:
            stem = photo.replace(".webp", "")
            current_keys.add(f"{album['name']}/{stem}")
    
    for key in list(all_photos.keys()):
        if key not in current_keys:
            print(f"[Clean] Removing deleted photo: {key}")
            del all_photos[key]
    
    # 保存元数据
    albums_data = {
        "albums": updated_albums,
        "allPhotos": all_photos
    }
    
    METADATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(METADATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(albums_data, f, ensure_ascii=False, indent=2)
    
    # 统计
    print("\n" + "=" * 60)
    print("[Done] Processing complete!")
    print(f"   Albums: {len(updated_albums)}")
    print(f"   Processed: {total_processed}")
    print(f"   Skipped: {total_skipped}")
    print(f"   Total photos: {len(all_photos)}")
    print("=" * 60)
    
    return True


if __name__ == "__main__":
    success = process_albums()
    sys.exit(0 if success else 1)
