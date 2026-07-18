#!/usr/bin/env python3
"""
高质量 PDF OCR 文字提取
- 300 DPI
- 灰度 + 对比度增强 + 降噪
- 自动检测左上角单元编号
"""
import sys, os, json, argparse, re
from pathlib import Path
from pdf2image import convert_from_path
import pytesseract
from PIL import Image, ImageFilter, ImageEnhance


def preprocess(img: Image.Image) -> Image.Image:
    """图像预处理：灰度 → 增强对比度 → 锐化 → 二值化"""
    # 灰度
    img = img.convert('L')
    # 对比度增强
    img = ImageEnhance.Contrast(img).enhance(1.8)
    # 锐化
    img = img.filter(ImageFilter.SHARPEN)
    # 大图用更高阈值
    return img


def ocr_page(img: Image.Image) -> str:
    """OCR 识别，中英文混合"""
    text = pytesseract.image_to_string(
        img,
        lang='chi_sim+eng',
        config='--psm 6'
    )
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    return '\n'.join(lines)


def detect_unit(img):
    """检测左上角的单元编号（1/4 区域）"""
    w, h = img.size
    # 只取左上角
    crop = img.crop((0, 0, w // 4, h // 8))
    text = pytesseract.image_to_string(crop, lang='eng', config='--psm 7 -c tessedit_char_whitelist=0123456789').strip()
    nums = re.findall(r'\d+', text)
    return int(nums[0]) if nums else None


def main():
    parser = argparse.ArgumentParser(description='高质量 PDF OCR')
    parser.add_argument('pdf_path')
    parser.add_argument('--dpi', type=int, default=300)
    parser.add_argument('--start', type=int, default=1)
    parser.add_argument('--end', type=int, default=0)
    parser.add_argument('--output', '-o', default='')
    args = parser.parse_args()

    pdf = Path(args.pdf_path)
    if not pdf.exists():
        print(f'❌ 文件不存在: {pdf}')
        sys.exit(1)

    out = args.output or f'src/data/books/{pdf.stem}_hq.json'
    end = args.end if args.end > 0 else None

    print(f'📄 {pdf.name} ({args.dpi} DPI, 高质量)')
    images = convert_from_path(str(pdf), dpi=args.dpi, first_page=args.start, last_page=end)

    results = []
    total = len(images)

    for i, img in enumerate(images):
        page_num = args.start + i
        print(f'  🔍 第 {page_num} 页 ...', end=' ', flush=True)

        # 预处理 + OCR
        processed = preprocess(img)
        text = ocr_page(processed)

        # 检测单元编号
        unit = detect_unit(img)

        entry = {
            'page': page_num,
            'unit': unit,
            'text': text,
            'char_count': len(text)
        }
        results.append(entry)

        unit_str = f'[Unit {unit}]' if unit else ''
        print(f'{len(text)} 字 {unit_str}')

    with open(out, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    total_chars = sum(r['char_count'] for r in results)
    units_found = sorted(set(r['unit'] for r in results if r['unit']))
    print(f'\n✅ {total} 页, {total_chars} 字 → {out}')
    print(f'📖 检测到单元: {units_found}')


if __name__ == '__main__':
    main()
