import { NextResponse } from 'next/server';

export async function GET() {
    const data = { message: 'hello!' };
    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const body = await request.json();
    return NextResponse.json({message: 'Data received', data: body});
}
