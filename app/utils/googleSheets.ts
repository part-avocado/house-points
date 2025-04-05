import { google } from 'googleapis';
import { House, HouseData } from '../types/house';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '';
const RANGES = {
  TOTAL_POINTS: 'G2',
  MESSAGE: 'H21',
  HOUSE_POINTS: 'I2:I8',
  LAST_INPUTS: 'A2:D100', // Include timestamp, house, and points columns
  CONTRIBUTORS: 'L2:M100',
};

const HOUSE_CONFIGS = [
  { name: 'Newton Hill', color: '#808080' },      // Gray
  { name: 'Green Hill', color: '#00cc66' },       // Green
  { name: 'Tatnuck Hill', color: '#ffaa44' },     // Orange
  { name: 'Bancroft Hill', color: '#0066cc' },    // Blue
  { name: 'Pakachoag Hill', color: '#9966ff' },   // Purple
  { name: 'Union Hill', color: '#ff4444' },       // Red
  { name: 'Chandler Hill', color: '#990000' },    // Dark Red
];

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

    // Get all data in a single batch request
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges: Object.values(RANGES),
      majorDimension: 'ROWS',
      valueRenderOption: 'FORMATTED_VALUE', // Changed to get string values
    });

    const [
      totalPointsData,
      messageData,
      housePointsData,
      lastInputsData,
      contributorsData,
    ] = response.data.valueRanges || [];

    // Process total points
    const totalPoints = parseInt(totalPointsData?.values?.[0]?.[0] || '0', 10);

    // Process house points
    const houses: House[] = HOUSE_CONFIGS.map((config, index) => ({
      name: config.name,
      points: parseInt(housePointsData?.values?.[index]?.[0] || '0', 10),
      color: config.color,
    })).sort((a, b) => b.points - a.points);

    // Process last inputs (now includes house and points in the same request)
    const lastInputs = (lastInputsData?.values || [])
      .filter(row => row[0] && String(row[0]).trim() !== '') // Convert to string before trimming
      .map(row => ({
        timestamp: String(row[0]), // Ensure timestamp is a string
        house: String(row[2] || ''), // Ensure house is a string
        points: parseInt(String(row[3] || '0'), 10), // Convert to string before parsing
      }))
      .slice(-3) // Take last 3 rows
      .reverse(); // Reverse to get newest first

    // Process contributors
    const contributorPoints = new Map<string, number>();
    (contributorsData?.values || []).forEach(row => {
      if (!row[0]) return; // Skip if no name
      const name = String(row[0]).trim();
      const points = parseInt(String(row[1] || '0'), 10);
      
      if (name !== '' && !isNaN(points) && points > 0) {
        const currentPoints = contributorPoints.get(name) || 0;
        contributorPoints.set(name, currentPoints + points);
      }
    });

    const topContributors = Array.from(contributorPoints.entries())
      .map(([name, points]) => ({
        email: name,
        points,
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);

    // Process message
    const message = messageData?.values?.[0]?.[0] ? String(messageData.values[0][0]) : undefined;

    return {
      houses,
      lastInputs,
      topContributors,
      message,
    };
  } catch (error) {
    console.error('Error fetching house data:', error);
    return { houses: [], lastInputs: [], topContributors: [], message: undefined };
  }
} 