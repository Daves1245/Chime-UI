import { NextRequest, NextResponse } from 'next/server';
import Server from '../../../models/Server';

export async function GET(request: NextRequest) {
    try {
        const body = await request.json();

        // mock 
        const servers = [
            new Server('Server', '127.0.0.1', 1234),
            new Server('Server2', 'hi there', 1),
            new Server('Server3', 'hi there', 1),
            new Server('Server4', 'hi there', 1),
            new Server('Server5', 'hi there', 1),
            new Server('Server6', 'hi there', 1),
        ];

        return NextResponse.json({message: 'Success', servers: servers});
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ message: 'Failed to fetch servers', error: error.message }, { status: 500 });
        } else {
            return NextResponse.json({ message: 'Unknown error occurred', error: String(error) }, { status: 500 });
        }
    }
}
