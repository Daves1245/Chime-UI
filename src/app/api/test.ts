import { NextResponse } from 'next/server';

export async function GET() {
  const data = {
    message: 'hello from api land',
  };
  return NextResponse.json(data);
}
