import { House, HouseData } from '../types/house';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '';
const API_KEY = process.env.GOOGLE_API_KEY || '';

// Consolidate all ranges into a single request
const RANGES = {
  TOTAL_POINTS: 'G2',
  HOUSE_POINTS: 'J2:J8',
  INPUTS: 'A2:D',
  CONTRIBUTORS: 'L2:M100',
  MESSAGE: 'H21',
  SHOW_BOARD: 'H24',
  BACKGROUND_COLOR: 'G5',
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
    // Use Google Sheets API with API key (public read-only access)
    const ranges = [
      RANGES.TOTAL_POINTS,
      RANGES.HOUSE_POINTS,
      RANGES.INPUTS,
      RANGES.CONTRIBUTORS,
      RANGES.MESSAGE,
      RANGES.SHOW_BOARD,
      RANGES.BACKGROUND_COLOR
    ].join('&ranges=');

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet?ranges=${ranges}&key=${API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status}`);
    }
    
    const data = await response.json();
    const valueRanges = data.valueRanges || [];
    
    // Process the responses - they will be in the same order as requested
    const [totalPointsResponse, housePointsResponse, lastInputsResponse, contributorsResponse, messageResponse, showBoardResponse, backgroundColorResponse] 
      = valueRanges;
    
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
      .filter((row: any) => 
        row[0] && row[0].trim() !== '' && // Has timestamp
        row[2] && row[2].trim() !== '' && // Has house name
        row[3] !== undefined && // Has points
        row[1] && row[1].trim() !== '' && // Email is not empty/whitespace
        row[1].trim().toLowerCase() !== 'eventengine' // Email is not 'eventengine'
      )
      .slice(-3) // Take last 3 valid entries
      .reverse() // Reverse to get newest first
      .map((row: any) => ({
        timestamp: row[0], // Column A
        house: row[2] || '', // Column C
        points: parseInt(row[3] || '0', 10), // Column D
      }));

    // Process contributor data
    const contributorPoints = new Map<string, number>();
    
    contributorRows.forEach((row: any) => {
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

    // Get background color from G5 cell
    const backgroundColorValue = backgroundColorResponse?.values?.[0]?.[0];
    let backgroundColor: string | undefined;
    
    if (backgroundColorValue && backgroundColorValue.trim() !== '') {
      const colorValue = backgroundColorValue.trim();
      // If it starts with #, use it as is, otherwise assume it's a color name/value and prepend #
      backgroundColor = colorValue.startsWith('#') ? colorValue : `#${colorValue}`;
    }

    return {
      houses: houses.sort((a, b) => b.points - a.points), // Sort by points in descending order
      lastInputs: lastInputsWithDetails,
      topContributors,
      message: message || undefined, // Only include message if it exists
      showBoard,
      backgroundColor
    };
  } catch (error) {
    console.error('Error fetching house data:', error);
    return { houses: [], lastInputs: [], topContributors: [], message: undefined, showBoard: false, backgroundColor: undefined };
  }
} 