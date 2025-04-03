import { google } from 'googleapis';
import { House, HouseData } from '../types/house';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '';
const TOTAL_POINTS_RANGE = 'G2';
const HOUSE_POINTS_RANGES = [
  { name: 'Newton Hill', range: 'I2' },
  { name: 'Green Hill', range: 'I3' },
  { name: 'Tatnuck Hill', range: 'I4' },
  { name: 'Bancroft Hill', range: 'I5' },
  { name: 'Pakachoag Hill', range: 'I6' },
  { name: 'Union Hill', range: 'I7' },
  { name: 'Chandler Hill', range: 'I8' },
];
const LAST_INPUTS_RANGE = 'A2:D4';

function getHouseColor(house: string): string {
  const colors: { [key: string]: string } = {
    'Newton Hill': '#808080',      // Gray
    'Green Hill': '#00cc66',       // Green
    'Tatnuck Hill': '#ffaa44',     // Orange
    'Bancroft Hill': '#0066cc',    // Blue
    'Pakachoag Hill': '#9966ff',   // Purple
    'Union Hill': '#ff4444',       // Red
    'Chandler Hill': '#990000',    // Dark Red
  };
  return colors[house] || '#cccccc';
}

export async function getHouseData(): Promise<HouseData> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get all data in parallel
    const [totalPointsResponse, housePointsResponse, lastInputsResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: TOTAL_POINTS_RANGE,
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'I2:I8',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: LAST_INPUTS_RANGE,
      }),
    ]);

    const totalPoints = parseInt(totalPointsResponse.data.values?.[0]?.[0] || '0', 10);
    const housePointsValues = housePointsResponse.data.values || [];
    const lastInputRows = lastInputsResponse.data.values;

    // Create houses array with points from the correct cells
    const houses: House[] = HOUSE_POINTS_RANGES.map((houseConfig, index) => ({
      name: houseConfig.name,
      points: parseInt(housePointsValues[index]?.[0] || '0', 10),
      color: getHouseColor(houseConfig.name),
    }));

    // Process last input data (A2:D4)
    const lastInputs = lastInputRows?.map(row => ({
      timestamp: row[0], // Column A
      house: row[2], // Column C
      points: parseInt(row[3], 10) || 0, // Column D
    })) || [];

    return {
      houses: houses.sort((a, b) => b.points - a.points), // Sort by points in descending order
      lastInputs,
    };
  } catch (error) {
    console.error('Error fetching house data:', error);
    return { houses: [], lastInputs: [] };
  }
} 