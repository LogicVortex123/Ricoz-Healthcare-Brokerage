import { NextResponse } from 'next/server';
export function GET() { return NextResponse.json({ success: false, error: { message: 'Legacy API retired. Use the authenticated Express API at /backend/transitions.' } }, { status: 410 }); }
export const POST = GET;
