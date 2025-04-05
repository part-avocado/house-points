import { google } from 'googleapis';
import { House, HouseData } from '../types/house';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '';
const TOTAL_POINTS_RANGE = 'G2';
const MESSAGE_RANGE = 'H21'; // Add message range
const HOUSE_POINTS_RANGES = [
  { name: 'Newton Hill', range: 'I2' },
  { name: 'Green Hill', range: 'I3' },
  { name: 'Tatnuck Hill', range: 'I4' },
  { name: 'Bancroft Hill', range: 'I5' },
  { name: 'Pakachoag Hill', range: 'I6' },
  { name: 'Union Hill', range: 'I7' },
  { name: 'Chandler Hill', range: 'I8' },
];
const LAST_INPUTS_RANGE = 'A2:A100'; // Read more rows to find last 3 non-empty
const CONTRIBUTORS_RANGE = 'L2:M100'; // Read contributor names and points from columns L and M

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
    const [totalPointsResponse, housePointsResponse, lastInputsResponse, contributorsResponse, messageResponse] = await Promise.all([
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
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: CONTRIBUTORS_RANGE,
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: MESSAGE_RANGE,
      }),
    ]);

    const totalPoints = parseInt(totalPointsResponse.data.values?.[0]?.[0] || '0', 10);
    const housePointsValues = housePointsResponse.data.values || [];
    const lastInputRows = lastInputsResponse.data.values || [];
    const contributorRows = contributorsResponse.data.values || [];

    // Create houses array with points from the correct cells
    const houses: House[] = HOUSE_POINTS_RANGES.map((houseConfig, index) => ({
      name: houseConfig.name,
      points: parseInt(housePointsValues[index]?.[0] || '0', 10),
      color: getHouseColor(houseConfig.name),
    }));

    // Get last 3 non-empty timestamps from column A and reverse the order
    const lastInputs = lastInputRows
      .filter(row => row[0] && row[0].trim() !== '') // Filter out empty rows
      .slice(-3) // Take last 3 rows
      .reverse() // Reverse to get newest first
      .map(row => ({
        timestamp: row[0], // Column A
        house: '', // We'll fill these in from the corresponding rows
        points: 0, // We'll fill these in from the corresponding rows
      }));

    // For each timestamp, get the corresponding house and points
    const lastInputsWithDetails = await Promise.all(
      lastInputs.map(async (input, index) => {
        const rowIndex = lastInputRows.findIndex(row => row[0] === input.timestamp) + 2; // +2 because rows are 1-indexed and we start from A2
        const rowResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `C${rowIndex}:D${rowIndex}`,
        });
        
        const rowData = rowResponse.data.values?.[0] || [];
        return {
          ...input,
          house: rowData[0] || '', // Column C
          points: parseInt(rowData[1] || '0', 10), // Column D
        };
      })
    );

    // Process contributor data
    const contributorPoints = new Map<string, number>();
    
    contributorRows.forEach(row => {
      const name = row[0]; // Column L (first column in our range)
      const points = parseInt(row[1] || '0', 10); // Column M (second column in our range)
      
      if (name && name.trim() !== '' && !isNaN(points) && points > 0) {
        const currentPoints = contributorPoints.get(name) || 0;
        contributorPoints.set(name, currentPoints + points);
      }
    });
    
    // Convert to array and sort by points
    const topContributors = Array.from(contributorPoints.entries())
      .map(([name, points]) => ({
        email: name, // Using the name field instead of email
        points
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5); // Get top 5 contributors

    // Get message from H21
    const message = messageResponse.data.values?.[0]?.[0];

    return {
      houses: houses.sort((a, b) => b.points - a.points), // Sort by points in descending order
      lastInputs: lastInputsWithDetails,
      topContributors,
      message: message || undefined, // Only include message if it exists
    };
  } catch (error) {
    console.error('Error fetching house data:', error);
    return { houses: [], lastInputs: [], topContributors: [], message: undefined };
  }
} 