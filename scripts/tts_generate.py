#!/usr/bin/env python3
"""
Edge TTS 语音合成脚本（免费，无需 API Key）
用法: python scripts/tts_generate.py <ocr_json>

发音人:
  zh-CN-XiaoxiaoNeural — 中文女声 晓晓（推荐小学生用）
  zh-CN-YunxiNeural    — 中文男声 云希
  en-US-JennyNeural    — 英文女声 Jenny
  en-US-GuyNeural      — 英文男声 Guy

语速: --speed +20% 或 --speed -10%
"""
import asyncio, os, sys, json, argparse
from pathlib import Path
import edge_tts

VOICES = {
    'xiaoxiao': {'id': 'zh-CN-XiaoxiaoNeural', 'desc': '晓晓（中文女声，清晰温和）'},
    'yunxi':    {'id': 'zh-CN-YunxiNeural',    'desc': '云希（中文男声）'},
    'jenny':    {'id': 'en-US-JennyNeural',    'desc': 'Jenny（英文女声）'},
    'guy':      {'id': 'en-US-GuyNeural',      'desc': 'Guy（英文男声）'},
}

# 英文句子用英文发音人，中文用中文
VOICE_ZH = 'zh-CN-XiaoxiaoNeural'
VOICE_EN = 'en-US-JennyNeural'

async def text_to_speech(text, voice, speed, output_path):
    """Edge TTS 合成"""
    if not text.strip():
        return False

    # 限制文本长度（Edge TTS 单次限制约 3000 字符）
    text = text[:2000]

    rate = f'{speed:+d}%'
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    try:
        await communicate.save(output_path)
        size_kb = os.path.getsize(output_path) / 1024
        print(f'  ✅ {size_kb:.0f}KB → {output_path}')
        return True
    except Exception as e:
        print(f'  ❌ 失败: {e}')
        return False


def detect_language(text):
    """简单检测文本主要语言"""
    chinese_chars = sum(1 for c in text if '一' <= c <= '鿿')
    return 'zh' if chinese_chars > len(text) * 0.3 else 'en'


async def process_ocr_json(json_path, voice='xiaoxiao', speed=0, start_page=1, end_page=0, output_dir='public/audio'):
    with open(json_path, 'r', encoding='utf-8') as f:
        pages = json.load(f)

    book_name = Path(json_path).stem
    base_dir = Path(output_dir) / book_name

    print(f'📖 {json_path}')
    print(f'📄 {len(pages)} 页, 发音人: {VOICES[voice]["desc"]}')
    print(f'📁 → {base_dir}/\n')

    success, failed, skipped = 0, 0, 0

    for page in pages:
        page_num = page['page']
        if page_num < start_page:
            continue
        if end_page > 0 and page_num > end_page:
            break

        text = page['text'].strip()
        if not text:
            continue

        # ── 文本预处理：按标点自然断句 ──
        import re
        # 1. 合并同一段落内的硬换行（中文或英文行末无标点 → 空格连接）
        text = re.sub(r'(?<![。！？.!?—…：:、])\s*\n\s*(?=[a-zA-Z一-鿿])', ' ', text)
        # 2. 标点后的换行保留（作为自然断句标记）
        text = re.sub(r'([。！？.!?])\s*\n\s*', r'\1\n', text)
        # 3. 移除多余空格
        text = re.sub(r' {2,}', ' ', text)

        # 合并为单个音频文件（每页一个）
        v = VOICE_ZH if detect_language(text) == 'zh' else VOICE_EN
        filename = f'page{page_num:03d}.mp3'
        output_path = base_dir / filename

        print(f'  📄 第{page_num}页 ({len(text)}字) → {v}', end=' ')
        if await text_to_speech(text, v, speed, str(output_path)):
            success += 1
        else:
            failed += 1

        # 避免限流
        await asyncio.sleep(0.5)

    print(f'\n🎉 完成! 成功: {success}, 失败: {failed}')


def main():
    parser = argparse.ArgumentParser(description='Edge TTS 语音合成')
    parser.add_argument('json_path', help='OCR JSON 文件')
    parser.add_argument('--voice', default='xiaoxiao', choices=list(VOICES.keys()), help='发音人')
    parser.add_argument('--speed', type=int, default=0, help='语速调整 (%%)')
    parser.add_argument('--start', type=int, default=1, help='起始页')
    parser.add_argument('--end', type=int, default=0, help='结束页 (0=全部)')
    parser.add_argument('--output', '-o', default='public/audio', help='输出目录')
    args = parser.parse_args()

    asyncio.run(process_ocr_json(
        args.json_path, args.voice, args.speed,
        args.start, args.end, args.output
    ))


if __name__ == '__main__':
    main()
