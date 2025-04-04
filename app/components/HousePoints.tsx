'use client';

import { useEffect, useState, useCallback } from 'react';
import { House, HouseData } from '../types/house';
import Image from 'next/image';

interface HousePointsProps {
  initialData: HouseData;
}

function formatTimeAgo(timestamp: string) {
  // Parse date in format "DD/MM/YYYY HH:mm:ss" in EST
  const [datePart, timePart] = timestamp.split(' ');
  const [day, month, year] = datePart.split('/');
  const [hours, minutes, seconds] = timePart.split(':');
  
  // Create date in EST
  const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours}:${minutes}:${seconds}-05:00`);
  const now = new Date();
  
  // Convert now to EST for comparison
  const nowEST = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const diffInMilliseconds = nowEST.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes === 1) return '1 minute ago';
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) return '1 hour ago';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  // For older dates, show the actual date
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== nowEST.getFullYear() ? 'numeric' : undefined 
  });
}

function validateHouseData(data: any): data is HouseData {
  // Basic structure check
  if (!data || typeof data !== 'object') return false;

  // Houses validation - required
  const hasValidHouses = Array.isArray(data.houses) &&
    data.houses.every((house: any) =>
      typeof house.name === 'string' &&
      typeof house.points === 'number' &&
      typeof house.color === 'string'
    );
  if (!hasValidHouses) return false;

  // Last inputs validation - required
  const hasValidLastInputs = Array.isArray(data.lastInputs) &&
    data.lastInputs.every((input: any) =>
      typeof input.timestamp === 'string' &&
      typeof input.house === 'string' &&
      typeof input.points === 'number'
    );
  if (!hasValidLastInputs) return false;

  // Top contributors validation - required
  const hasValidTopContributors = Array.isArray(data.topContributors) &&
    data.topContributors.every((contributor: any) =>
      typeof contributor.email === 'string' &&
      typeof contributor.points === 'number'
    );
  if (!hasValidTopContributors) return false;

  // Message validation - optional but must be string if present
  if (data.message !== undefined && typeof data.message !== 'string') return false;

  return true;
}

export default function HousePoints({ initialData }: HousePointsProps) {
  const [data, setData] = useState<HouseData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextRefresh, setNextRefresh] = useState(30);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMouse, setShowMouse] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Add timestamp to prevent caching
      const response = await fetch(`/api/houses?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newData = await response.json();
      
      // Basic structure validation
      if (!newData || typeof newData !== 'object') {
        throw new Error('Invalid response format');
      }

      // Validate houses array - required
      if (!Array.isArray(newData.houses)) {
        throw new Error('Houses data is missing or invalid');
      }

      // Ensure houses have required properties
      const validHouses = newData.houses.every((house: any) => 
        house && 
        typeof house.name === 'string' && 
        typeof house.points === 'number' && 
        typeof house.color === 'string'
      );

      if (!validHouses) {
        throw new Error('Invalid house data structure');
      }

      // Validate lastInputs - use empty array if missing or invalid
      if (!Array.isArray(newData.lastInputs)) {
        console.warn('Last inputs missing or invalid, using empty array');
        newData.lastInputs = [];
      }

      // Validate topContributors - use empty array if missing or invalid
      if (!Array.isArray(newData.topContributors)) {
        console.warn('Top contributors missing or invalid, using empty array');
        newData.topContributors = [];
      }

      // Only update state if we have valid houses
      if (newData.houses.length > 0) {
        setData(newData);
        setLastUpdate(Date.now());
        setNextRefresh(30);
        setError(null);
      } else {
        throw new Error('No house data available');
      }
    } catch (err) {
      console.error('Error fetching house data:', err);
      // Keep existing data and show error
      setError('Failed to load data. Retrying...');
      setNextRefresh(3); // Retry sooner on error
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove data dependency to prevent unnecessary re-renders

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        
        // Add a delay before hiding the mouse cursor
        setTimeout(() => {
          if (document.fullscreenElement) {
            setShowMouse(false);
          }
        }, 1000);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        setShowMouse(true);
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
      setIsFullscreen(false);
      setShowMouse(true);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up intervals
    const refreshInterval = setInterval(fetchData, 30000);
    const countdownInterval = setInterval(() => {
      setNextRefresh(prev => prev > 0 ? prev - 1 : 30);
    }, 1000);

    // Handle fullscreen keyboard shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    // Handle mouse movement in fullscreen
    const handleMouseMove = () => {
      if (isFullscreen) {
        setShowMouse(true);
        // Hide mouse after 3 seconds of inactivity
        const timeout = setTimeout(() => {
          if (document.fullscreenElement) {
            setShowMouse(false);
          }
        }, 3000);
        return () => clearTimeout(timeout);
      }
    };

    // Handle fullscreen change
    const handleFullscreenChange = () => {
      const isInFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isInFullscreen);
      setShowMouse(!isInFullscreen);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Cleanup
    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [fetchData, toggleFullscreen, isFullscreen]);

  // Calculate total points
  const totalPoints = data.houses.reduce((sum, house) => sum + house.points, 0);

  return (
    <div 
      className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-8 relative transition-all duration-300 ${!showMouse ? 'cursor-none' : ''}`}
    >
      <div className="max-w-7xl mx-auto relative min-h-[calc(100vh-2rem)] sm:min-h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 sm:gap-8">
          {/* Left Column - Rankings */}
          <div className="space-y-4">
            {data.houses.map((house, index) => (
              <div
                key={`${house.name}-${house.points}-${lastUpdate}`}
                className="rounded-lg p-4 sm:p-6 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl flex items-center backdrop-blur-sm bg-opacity-95"
                style={{ backgroundColor: house.color }}
              >
                <div className="text-3xl sm:text-4xl font-bold mr-4 sm:mr-6 w-10 sm:w-12">#{index + 1}</div>
                <div className="flex-grow">
                  <h3 className="text-xl sm:text-2xl font-bold">{house.name}</h3>
                </div>
                <div className="text-3xl sm:text-4xl font-bold">{house.points}</div>
              </div>
            ))}
          </div>

          {/* Right Column - Stats */}
          <div className="lg:w-80 space-y-4">
            {/* Total Points Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 sm:p-6 shadow-lg sticky top-4 sm:top-8 backdrop-blur-sm">
              <h2 className="text-lg sm:text-xl font-bold mb-2">Total Points Awarded</h2>
              <div className="text-4xl sm:text-6xl font-bold">{totalPoints}</div>
            </div>

            {/* Last Inputs Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-lg backdrop-blur-sm">
              <h2 className="text-lg sm:text-xl font-bold mb-4 dark:text-white">Latest Activity</h2>
              <div className="space-y-3">
                {data.lastInputs.map((input, index) => (
                  <div 
                    key={`${input.house}-${input.points}-${input.timestamp}-${lastUpdate}`}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-xs sm:text-sm"
                  >
                    <span className="font-bold text-blue-600 dark:text-blue-400 w-12 sm:w-14">
                      +{input.points}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 truncate">
                      to {input.house}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 text-right">
                      {formatTimeAgo(input.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Contributors Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-lg backdrop-blur-sm">
              <h2 className="text-lg sm:text-xl font-bold mb-4 dark:text-white">Top Contributors</h2>
              <div className="space-y-3">
                {data.topContributors.map((contributor, index) => (
                  <div 
                    key={`${contributor.email}-${contributor.points}-${lastUpdate}`}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-xs sm:text-sm"
                  >
                    <span className="font-bold text-purple-600 dark:text-purple-400 w-6 sm:w-8">
                      #{index + 1}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 truncate">
                      {contributor.email}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 font-bold">
                      {contributor.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Logo - Fixed to bottom right */}
        <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-10">
          <Image
            src="/bancroftlogo.svg"
            alt="Bancroft School"
            width={48}
            height={48}
            className="h-8 sm:h-12 w-auto"
            priority
          />
        </div>

        {/* Message and Refresh Timer - Centered at bottom */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          {data.message && (
            <div className="text-xl sm:text-2xl font-medium text-center text-gray-700 dark:text-gray-200">
              {data.message}
            </div>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {isLoading ? 'Refreshing...' : `Next refresh in ${nextRefresh}s`}
            {error && <span className="text-red-500 ml-2">{error}</span>}
          </div>
        </div>
      </div>
    </div>
  );
} 