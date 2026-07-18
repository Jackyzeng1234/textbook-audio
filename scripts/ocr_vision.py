#!/usr/bin/env python3
"""
macOS Vision OCR — 高质量文字识别
macOS 14+ 内置，无需安装，比 Tesseract 准确得多
"""
import sys, os, json, argparse, subprocess, tempfile
from pathlib import Path
from pdf2image import convert_from_path


def ocr_page_with_vision(img_path: str) -> str:
    """调用 macOS Vision 框架识别图片文字"""
    result = subprocess.run(
        ['/tmp/vision_ocr', img_path],
        capture_output=True, text=True, timeout=30
    )
    lines = [l.strip() for l in result.stdout.split('\n') if l.strip()]
    return '\n'.join(lines)


def detect_unit_with_vision(img_path: str):
    """用 Vision 单独识别左上角区域"""
    from PIL import Image
    img = Image.open(img_path)
    w, h = img.size
    crop = img.crop((20, 10, w // 3, h // 10))
    crop_path = img_path.replace('.png', '_crop.png')
    crop.save(crop_path)

    result = subprocess.run(
        ['/tmp/vision_ocr', crop_path],
        capture_output=True, text=True, timeout=15
    )
    text = result.stdout.strip()
    import re
    nums = re.findall(r'\b(\d+)\b', text)
    # 过滤掉明显不是单元号的数字（大于 20 或等于 0）
    valid = [int(n) for n in nums if 1 <= int(n) <= 20]
    return valid[0] if valid else None


def main():
    parser = argparse.ArgumentParser(description='macOS Vision OCR')
    parser.add_argument('pdf_path')
    parser.add_argument('--dpi', type=int, default=250)
    parser.add_argument('--start', type=int, default=1)
    parser.add_argument('--end', type=int, default=0)
    parser.add_argument('--output', '-o', default='')
    args = parser.parse_args()

    # 检查 Vision OCR 工具是否已编译
    if not os.path.exists('/tmp/vision_ocr'):
        print('❌ Vision OCR 工具未编译，正在编译...')
        swift_src = '''
import Vision
import AppKit
import Foundation

let args = CommandLine.arguments
guard args.count > 1 else { exit(1) }
let imgPath = args[1]

guard let img = NSImage(contentsOfFile: imgPath),
      let cgImage = img.cgImage(forProposedRect: nil, context: nil, hints: nil)
else { exit(1) }

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.recognitionLanguages = ["zh-Hans", "en-US"]
request.usesLanguageCorrection = true

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
try? handler.perform([request])

guard let results = request.results else { exit(0) }
for obs in results {
    if let top = obs.topCandidates(1).first {
        print(top.string)
    }
}
'''
        with open('/tmp/vision_ocr.swift', 'w') as f:
            f.write(swift_src)
        subprocess.run(['swiftc', '-o', '/tmp/vision_ocr', '/tmp/vision_ocr.swift'], check=True)
        print('✅ 编译完成')

    pdf = Path(args.pdf_path)
    if not pdf.exists():
        print(f'❌ 文件不存在: {pdf}')
        sys.exit(1)

    out = args.output or f'src/data/books/{pdf.stem}_vision.json'
    end = args.end if args.end > 0 else None

    print(f'📄 {pdf.name} ({args.dpi} DPI, macOS Vision)')
    images = convert_from_path(str(pdf), dpi=args.dpi, first_page=args.start, last_page=end)

    results = []
    total = len(images)

    with tempfile.TemporaryDirectory() as tmpdir:
        for i, img in enumerate(images):
            page_num = args.start + i
            print(f'  🔍 第 {page_num} 页 ...', end=' ', flush=True)

            img_path = os.path.join(tmpdir, f'p{page_num}.png')
            img.save(img_path, 'PNG')

            text = ocr_page_with_vision(img_path)
            unit = detect_unit_with_vision(img_path)

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
