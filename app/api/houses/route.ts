import { NextResponse } from 'next/server';
import { getHouseData } from '../../utils/googleSheets';

export const revalidate = 0;

export async function GET() {
  try {
    const data = await getHouseData();
    
    // Validate the data structure
    if (!data.houses || !Array.isArray(data.houses) || !data.lastInputs || !Array.isArray(data.lastInputs)) {
      throw new Error('Invalid data structure received from Google Sheets');
    }

    // Set cache control headers to prevent caching
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error('Error in /api/houses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch house data' },
      { status: 500 }
    );
  }
} 