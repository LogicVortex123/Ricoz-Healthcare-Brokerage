import { NextResponse } from 'next/server';
export function PATCH() { return NextResponse.json({ success: false, error: { message: 'Use authenticated transition stage actions.' } }, { status: 410 }); }
