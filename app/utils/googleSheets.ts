import { google } from 'googleapis';
import { House, HouseData } from '../types/house';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '';
// Consolidate all ranges into a single request
const RANGES = {
  TOTAL_POINTS: 'G2',
  HOUSE_POINTS: 'J2:J8',
  INPUTS: 'A2:D100',
  CONTRIBUTORS: 'L2:M100',
  MESSAGE: 'H21',
  SHOW_BOARD: 'H24',
};

const HOUSE_POINTS_RANGES = [
  { name: 'Newton Hill', range: 'J2' },
  { name: 'Green Hill', range: 'J3' },
  { name: 'Tatnuck Hill', range: 'J4' },
  { name: 'Bancroft Hill', range: 'J5' },
  { name: 'Pakachoag Hill', range: 'J6' },
  { name: 'Union Hill', range: 'J7' },
  { name: 'Chandler Hill', range: 'J8' },
];

function getHouseColor(house: string): string {
  const colors: { [key: string]: string } = {
    'Newton Hill': '#C0C0C0',      // Silver
    'Green Hill': '#00cc66',       // Green
    'Tatnuck Hill': '#FFD700',     // Gold
    'Bancroft Hill': '#0066cc',    // Blue
    'Pakachoag Hill': '#9966ff',   // Purple
    'Union Hill': '#ff4444',       // Red
    'Chandler Hill': '#800000',    // Maroon
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
    
    // Get all data in a single API call with multiple ranges
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [
        RANGES.TOTAL_POINTS,
        RANGES.HOUSE_POINTS,
        RANGES.INPUTS,
        RANGES.CONTRIBUTORS,
        RANGES.MESSAGE,
        RANGES.SHOW_BOARD
      ],
    });
    
    // Process the responses - they will be in the same order as requested
    const [totalPointsResponse, housePointsResponse, lastInputsResponse, contributorsResponse, messageResponse, showBoardResponse] 
      = response.data.valueRanges || [];
    
    const totalPoints = parseInt(totalPointsResponse.values?.[0]?.[0] || '0', 10);
    const housePointsValues = housePointsResponse.values || [];
    const lastInputRows = lastInputsResponse.values || [];
    const contributorRows = contributorsResponse.values || [];

    // Create houses array with points from the correct cells
    const houses: House[] = HOUSE_POINTS_RANGES.map((houseConfig, index) => ({
      name: houseConfig.name,
      points: parseInt(housePointsValues[index]?.[0] || '0', 10),
      color: getHouseColor(houseConfig.name),
    }));

    // Process last inputs data - only include rows that have all required data
    const lastInputsWithDetails = lastInputRows
      .filter(row => 
        row[0] && row[0].trim() !== '' && // Has timestamp
        row[2] && row[2].trim() !== '' && // Has house name
        row[3] !== undefined && // Has points
        row[1] && row[1].trim() !== '' && // Email is not empty/whitespace
        row[1].trim().toLowerCase() !== 'eventengine' // Email is not 'eventengine'
      )
      .slice(-3) // Take last 3 valid entries
      .reverse() // Reverse to get newest first
      .map(row => ({
        timestamp: row[0], // Column A
        house: row[2] || '', // Column C
        points: parseInt(row[3] || '0', 10), // Column D
      }));

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

    // Get message
    const message = messageResponse.values?.[0]?.[0];

    const showBoard = (showBoardResponse?.values?.[0]?.[0] || '').toString().toLowerCase() === 'true';

    return {
      houses: houses.sort((a, b) => b.points - a.points), // Sort by points in descending order
      lastInputs: lastInputsWithDetails,
      topContributors,
      message: message || undefined, // Only include message if it exists
      showBoard
    };
  } catch (error) {
    console.error('Error fetching house data:', error);
    return { houses: [], lastInputs: [], topContributors: [], message: undefined, showBoard: false };
  }
} 