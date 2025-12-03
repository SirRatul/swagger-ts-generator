'use client';

import { useState, useEffect, useMemo } from 'react';
import { Endpoint } from '../lib/api';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

interface EndpointSelectorProps {
  endpoints: Endpoint[];
  onGenerate: (selectedIds: string[]) => void;
  loading: boolean;
}

export default function EndpointSelector({
  endpoints,
  onGenerate,
  loading,
}: EndpointSelectorProps) {
  const [selectedEndpoints, setSelectedEndpoints] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Update selectAll state when endpoints change
  useEffect(() => {
    setSelectedEndpoints(new Set());
    setSelectAll(false);
    setSearchQuery('');
  }, [endpoints]);

  // Filter endpoints based on search query
  const filteredEndpoints = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return endpoints;
    
    return endpoints.filter((endpoint) => 
      endpoint.path.toLowerCase().includes(query) ||
      endpoint.method.toLowerCase().includes(query) ||
      (endpoint.summary && endpoint.summary.toLowerCase().includes(query))
    );
  }, [endpoints, searchQuery]);

  const handleToggleAll = () => {
    if (selectAll) {
      setSelectedEndpoints(new Set());
      setSelectAll(false);
    } else {
      // Select all FILTERED endpoints, not just all endpoints
      const newSelected = new Set(selectedEndpoints);
      filteredEndpoints.forEach(ep => newSelected.add(ep.id));
      setSelectedEndpoints(newSelected);
      setSelectAll(true);
    }
  };

  const handleToggleEndpoint = (id: string) => {
    const newSelected = new Set(selectedEndpoints);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      setSelectAll(false);
    } else {
      newSelected.add(id);
      // Check if all filtered endpoints are selected
      const allFilteredSelected = filteredEndpoints.every(ep => newSelected.has(ep.id));
      if (allFilteredSelected) {
        setSelectAll(true);
      }
    }
    setSelectedEndpoints(newSelected);
  };

  const handleGenerate = () => {
    onGenerate(Array.from(selectedEndpoints));
  };

  const getMethodColor = (method: string) => {
    const colors: { [key: string]: string } = {
      GET: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
      POST: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
      PUT: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800',
      PATCH: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800',
      DELETE: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800',
    };
    return colors[method] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
  };

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const endpoint = filteredEndpoints[index];
    return (
      <div style={style} className="px-1 sm:px-2 py-1">
        <label
          className="flex items-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-500 h-full"
        >
          <input
            type="checkbox"
            checked={selectedEndpoints.has(endpoint.id)}
            onChange={() => handleToggleEndpoint(endpoint.id)}
            className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer flex-shrink-0"
          />
          <div className="ml-2 sm:ml-4 flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <span
                className={`px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-semibold rounded-md border flex-shrink-0 ${getMethodColor(
                  endpoint.method
                )}`}
              >
                {endpoint.method}
              </span>
              <span className="font-mono text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-medium truncate" title={endpoint.path}>
                {endpoint.path}
              </span>
            </div>
            {endpoint.summary && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1 truncate" title={endpoint.summary}>{endpoint.summary}</p>
            )}
          </div>
        </label>
      </div>
    );
  };

  if (endpoints.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-100 dark:border-gray-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2">
            🎯 Select Endpoints
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredEndpoints.length !== endpoints.length 
              ? `Showing ${filteredEndpoints.length} of ${endpoints.length} endpoints` 
              : `Found ${endpoints.length} endpoints`} 
            {' • '}
            {selectedEndpoints.size} selected
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search endpoints..."
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full md:w-64 text-sm"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          
          <button
            onClick={handleToggleAll}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors border border-primary-200 dark:border-primary-800 whitespace-nowrap"
          >
            {selectAll ? '✓ Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      <div className="h-64 sm:h-80 md:h-96 mb-4 sm:mb-6 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50/50 dark:bg-gray-900/50">
        {filteredEndpoints.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            No endpoints match your search
          </div>
        ) : (
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                itemCount={filteredEndpoints.length}
                itemSize={80}
                width={width}
              >
                {Row}
              </List>
            )}
          </AutoSizer>
        )}
      </div>

      <button
        onClick={handleGenerate}
        disabled={selectedEndpoints.size === 0 || loading}
        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Generating TypeScript...
          </span>
        ) : (
          `✨ Generate TypeScript (${selectedEndpoints.size})`
        )}
      </button>
    </div>
  );
}
