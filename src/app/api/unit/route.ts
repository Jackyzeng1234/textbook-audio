import { NextRequest, NextResponse } from 'next/server';
import { loadBookData } from '@/lib/data-loader';

export async function GET(request: NextRequest) {
  const bookId = request.nextUrl.searchParams.get('bookId');
  const unitId = request.nextUrl.searchParams.get('unitId');

  if (!bookId) {
    return NextResponse.json({ error: 'bookId required' }, { status: 400 });
  }

  const data = loadBookData(bookId);
  if (!data) {
    return NextResponse.json({ error: 'book not found' }, { status: 404 });
  }

  if (unitId) {
    const unit = data.units.find((u) => u.id === unitId);
    if (!unit) {
      return NextResponse.json({ error: 'unit not found' }, { status: 404 });
    }
    return NextResponse.json(unit);
  }

  return NextResponse.json(data.units);
}
