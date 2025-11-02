import { NextResponse } from 'next/server';
import { loadCredentials } from '@/util/Credentials';

export const dynamic = 'force-static';

export async function GET() {
  try {
    const credentials = await loadCredentials();
    return NextResponse.json({
      websocket: {
        url: `ws://localhost:${credentials.chat.port}`,
      },
    });
  } catch (error) {
    console.error('Failed to load credentials:', error);
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    );
  }
}
