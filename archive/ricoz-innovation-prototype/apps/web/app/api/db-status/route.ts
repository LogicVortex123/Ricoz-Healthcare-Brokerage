import { NextResponse } from 'next/server';
export function GET() { return NextResponse.json({ success: false, error: { message: 'Database inspection is not publicly available.' } }, { status: 410 }); }
