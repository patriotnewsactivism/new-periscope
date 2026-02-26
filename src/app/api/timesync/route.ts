import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse(Date.now().toString());
}

export async function POST() {
  return new NextResponse(Date.now().toString());
}
