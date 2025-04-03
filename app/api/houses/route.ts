import { NextResponse } from 'next/server';
import { getHouseData } from '../../utils/googleSheets';

export async function GET() {
  try {
    const data = await getHouseData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/houses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch house data' },
      { status: 500 }
    );
  }
} 