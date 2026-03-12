#!/usr/bin/env python3
"""
图片处理脚本
- 压缩原图为 WebP（主图 ≤1MB，缩略图 ≤200KB）
- 提取 EXIF 信息到 JSON
- 自动同步 originals 与 public/photos
"""

import os
import sys
import json
import shutil
from pathlib import Path
from PIL import Image
from PIL.ExifTags import TAGS
import piexif

# 配置
ORIGINALS_DIR = Path("originals")
PHOTOS_DIR = Path("public/photos")
THUMBNAILS_DIR = Path("public/thumbnails")
METADATA_FILE = Path("public/photos.json")

# 压缩参数
MAX_MAIN_SIZE = 900 * 1024  # 900KB (留一些余量)
MAX_THUMB_SIZE = 150 * 1024  # 150KB
MAIN_QUALITY = 80
THUMB_QUALITY = 70
THUMB_MAX_DIMENSION = 400  # 缩略图最大边长


def get_exif_data(image_path):
    """提取 EXIF 信息"""
    try:
        image = Image.open(image_path)
        exif_dict = piexif.load(image.info.get('exif', b''))
        
        exif_data = {}
        
        # 提取常用 EXIF 字段
        if piexif.ExifIFD.FNumber in exif_dict.get('Exif', {}):
            fnumber = exif_dict['Exif'][piexif.ExifIFD.FNumber]
            if isinstance(fnumber, tuple):
                exif_data['aperture'] = f"f/{fnumber[0] / fnumber[1]:.1f}"
        
        if piexif.ExifIFD.ExposureTime in exif_dict.get('Exif', {}):
            exposure = exif_dict['Exif'][piexif.ExifIFD.ExposureTime]
            if isinstance(exposure, tuple):
                numerator, denominator = exposure
                if numerator >= denominator:
                    exif_data['shutterSpeed'] = f'{numerator // denominator}"'
                else:
                    exif_data['shutterSpeed'] = f"1/{int(denominator/numerator)}s"
        
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
        print(f"  警告: 无法提取 EXIF: {e}")
        return None


def compress_image(input_path, output_path, max_size, quality, is_thumbnail=False):
    """
    压缩图片到指定大小以内
    返回: (success, final_size)
    """
    try:
        img = Image.open(input_path)
        
        # 转换为 RGB（处理 PNG 等带透明通道的图片）
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # 缩略图：先缩小尺寸
        if is_thumbnail:
            img.thumbnail((THUMB_MAX_DIMENSION, THUMB_MAX_DIMENSION), Image.LANCZOS)
        else:
            # 主图：如果文件太大，先缩小尺寸
            file_size = input_path.stat().st_size
            if file_size > max_size * 2:
                # 根据文件大小估算缩放比例
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
        
        # 如果还是太大，进一步缩小图片
        if size > max_size and not is_thumbnail:
            img.thumbnail((img.width // 2, img.height // 2), Image.LANCZOS)
            buffer = BytesIO()
            img.save(buffer, format='WEBP', quality=max(40, quality - 20), method=4)
            size = buffer.tell()
        
        # 保存结果
        if size <= max_size or is_thumbnail:  # 缩略图可以稍微超一点
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'wb') as f:
                f.write(buffer.getvalue())
            return True, size
        else:
            print(f"  Warning: Could not compress below {max_size/1024:.0f}KB, got {size/1024:.0f}KB")
            # 还是保存，但标记警告
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'wb') as f:
                f.write(buffer.getvalue())
            return True, size
            
    except Exception as e:
        print(f"  Error: Compression failed: {e}")
        return False, 0


def process_photos():
    """主处理函数"""
    print("=" * 60)
    print("[Photo] Starting photo processing...")
    print("=" * 60)
    
    # 检查原图目录
    if not ORIGINALS_DIR.exists():
        print(f"[Error] Originals directory not found: {ORIGINALS_DIR}")
        print("   Please put original photos in this directory")
        return False
    
    # 加载现有元数据
    metadata = {}
    if METADATA_FILE.exists():
        try:
            with open(METADATA_FILE, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            print(f"[Info] Loaded existing metadata: {len(metadata)} records")
        except:
            metadata = {}
    
    # 扫描原图
    original_files = []
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.webp', '*.JPG', '*.JPEG', '*.PNG', '*.WEBP']:
        original_files.extend(ORIGINALS_DIR.glob(ext))
    
    print(f"[Info] Found {len(original_files)} original photos")
    
    # 跟踪已处理的文件
    processed_names = set()
    updated_count = 0
    skipped_count = 0
    error_count = 0
    
    for orig_path in original_files:
        # 生成输出文件名（使用原文件名，但改为 .webp）
        stem = orig_path.stem
        output_name = f"{stem}.webp"
        main_path = PHOTOS_DIR / output_name
        thumb_path = THUMBNAILS_DIR / output_name
        
        processed_names.add(stem)
        
        # 检查是否需要更新（原图比输出文件新，或输出文件不存在）
        needs_update = (
            not main_path.exists() or 
            not thumb_path.exists() or
            orig_path.stat().st_mtime > main_path.stat().st_mtime
        )
        
        if not needs_update:
            print(f"[Skip] {orig_path.name} (not changed)")
            skipped_count += 1
            continue
        
        print(f"\n[Process] {orig_path.name}")
        
        # 提取 EXIF（只在原图上提取一次）
        exif_data = get_exif_data(orig_path)
        
        # 压缩主图
        print(f"   Compressing main image...", end='')
        success, main_size = compress_image(
            orig_path, main_path, MAX_MAIN_SIZE, MAIN_QUALITY
        )
        if success:
            print(f" OK {main_size / 1024:.1f}KB")
        else:
            print(f" Failed")
            error_count += 1
            continue
        
        # 生成缩略图
        print(f"   Generating thumbnail...", end='')
        success, thumb_size = compress_image(
            orig_path, thumb_path, MAX_THUMB_SIZE, THUMB_QUALITY, is_thumbnail=True
        )
        if success:
            print(f" OK {thumb_size / 1024:.1f}KB")
        else:
            print(f" Warning: Using main image as thumbnail")
            shutil.copy(main_path, thumb_path)
        
        # 更新元数据
        metadata[stem] = {
            'filename': output_name,
            'originalName': orig_path.name,
            'mainSize': main_size,
            'thumbSize': thumb_size,
            'exif': exif_data or {},
            'processedAt': json.dumps({})[:0]  # 触发时间戳更新
        }
        
        updated_count += 1
    
    # 清理已删除的照片
    current_stems = set()
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.webp']:
        current_stems.update(p.stem for p in ORIGINALS_DIR.glob(ext))
    
    removed = []
    for stem in list(metadata.keys()):
        if stem not in current_stems:
            removed.append(stem)
            main_file = PHOTOS_DIR / f"{stem}.webp"
            thumb_file = THUMBNAILS_DIR / f"{stem}.webp"
            if main_file.exists():
                main_file.unlink()
            if thumb_file.exists():
                thumb_file.unlink()
            del metadata[stem]
    
    if removed:
        print(f"\n[Clean] Removed {len(removed)} deleted photos")
    
    # 保存元数据
    METADATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(METADATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    
    # 统计
    print("\n" + "=" * 60)
    print("[Done] Processing complete!")
    print(f"   Added/Updated: {updated_count}")
    print(f"   Skipped: {skipped_count}")
    print(f"   Removed: {len(removed)}")
    print(f"   Errors: {error_count}")
    print(f"   Total: {len(metadata)}")
    print("=" * 60)
    
    return True


if __name__ == "__main__":
    success = process_photos()
    sys.exit(0 if success else 1)
