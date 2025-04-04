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
const LAST_INPUTS_RANGE = 'A2:A100'; // Read more rows to find last 3 non-empty
const EMAIL_DATA_RANGE = 'B2:D100'; // Read email data from columns B, C, D

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

// Function to truncate email domain
function truncateEmail(email: string): string {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  return `${parts[0]}@...`;
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
    const [totalPointsResponse, housePointsResponse, lastInputsResponse, emailDataResponse] = await Promise.all([
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
        range: EMAIL_DATA_RANGE,
      }),
    ]);

    const totalPoints = parseInt(totalPointsResponse.data.values?.[0]?.[0] || '0', 10);
    const housePointsValues = housePointsResponse.data.values || [];
    const lastInputRows = lastInputsResponse.data.values || [];
    const emailDataRows = emailDataResponse.data.values || [];

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

    // Debug logging
    console.log('Email data rows:', {
      totalRows: emailDataRows.length,
      sampleRows: emailDataRows.slice(0, 3)
    });
    
    // Process email data to find top contributors
    const emailContributions = new Map<string, number>();
    
    emailDataRows.forEach(row => {
      if (row[0] && row[0].trim() !== '') {
        const email = row[0].trim();
        const points = parseInt(row[2] || '0', 10);
        
        if (!isNaN(points) && points > 0) {
          const currentPoints = emailContributions.get(email) || 0;
          emailContributions.set(email, currentPoints + points);
        }
      }
    });
    
    // Debug logging
    console.log('Email contributions:', {
      totalContributors: emailContributions.size,
      sampleContributions: Array.from(emailContributions.entries()).slice(0, 3)
    });
    
    // Convert to array and sort by points
    const topContributors = Array.from(emailContributions.entries())
      .map(([email, points]) => ({
        email: truncateEmail(email),
        points
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5); // Get top 5 contributors

    // Debug logging
    console.log('Top contributors:', topContributors);

    return {
      houses: houses.sort((a, b) => b.points - a.points), // Sort by points in descending order
      lastInputs: lastInputsWithDetails,
      topContributors
    };
  } catch (error) {
    console.error('Error fetching house data:', error);
    return { houses: [], lastInputs: [], topContributors: [] };
  }
} 