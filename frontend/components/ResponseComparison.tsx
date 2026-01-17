import { useState, useMemo } from 'react';
import { Endpoint, ComparisonError, compareResponse } from '../lib/api';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

interface ResponseComparisonProps {
  endpoints: Endpoint[];
  swaggerJson: any;
}

export default function ResponseComparison({
  endpoints,
  swaggerJson,
}: ResponseComparisonProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userResponse, setUserResponse] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<{
    isValid: boolean;
    errors: ComparisonError[];
    summary: {
      totalErrors: number;
      missingCount: number;
      typeMismatchCount: number;
      extraCount: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

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

  const handleCompare = async () => {
    setError('');
    setComparisonResult(null);

    if (!selectedEndpoint) {
      setError('Please select an endpoint');
      return;
    }

    if (!userResponse.trim()) {
      setError('Please enter a response to compare');
      return;
    }

    // Validate JSON
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(userResponse);
    } catch (e) {
      setError('Invalid JSON format. Please check your response.');
      return;
    }

    setLoading(true);

    try {
      const result = await compareResponse(
        selectedEndpoint,
        parsedResponse,
        swaggerJson,
        endpoints
      );
      setComparisonResult(result.comparison);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to compare response. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'missing':
        return '❌';
      case 'type_mismatch':
        return '⚠️';
      case 'extra':
        return 'ℹ️';
      case 'invalid_value':
        return '🚫';
      default:
        return '•';
    }
  };

  const getErrorColor = (type: string) => {
    switch (type) {
      case 'missing':
        return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'type_mismatch':
        return 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'extra':
        return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'invalid_value':
        return 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      default:
        return 'text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
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
            type="radio"
            name="endpoint-selection"
            checked={selectedEndpoint === endpoint.id}
            onChange={() => setSelectedEndpoint(endpoint.id)}
            className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 border-gray-300 focus:ring-primary-500 cursor-pointer flex-shrink-0"
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

  const selectedEndpointData = endpoints.find((ep) => ep.id === selectedEndpoint);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-100 dark:border-gray-800">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2">
          🔍 Response Comparison
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Compare your actual API response with the expected schema
        </p>
      </div>

      {/* Endpoint Selector */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Endpoint {selectedEndpoint && `(1 selected)`}
          </label>
          
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
        </div>

        <div className="h-64 sm:h-72 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
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
      </div>

      {/* Response Input */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Your API Response (JSON)
            </label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              📋 Paste the actual JSON response from your API call (not TypeScript types)
            </p>
          </div>
        </div>
        <textarea
          value={userResponse}
          onChange={(e) => setUserResponse(e.target.value)}
          placeholder={'{\n  "userId": "123",\n  "userName": "john",\n  "isActive": true\n}'}
          className="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
        />
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          💡 Tip: Copy the response from your network tab or API testing tool (Postman, Insomnia, etc.)
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Compare Button */}
      <button
        onClick={handleCompare}
        disabled={loading || !selectedEndpoint || !userResponse.trim()}
        className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-primary-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg mb-6"
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
            Comparing...
          </span>
        ) : (
          '🔍 Compare Response'
        )}
      </button>

      {/* Comparison Results */}
      {comparisonResult && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          {/* Summary */}
          <div
            className={`p-4 rounded-lg mb-6 ${
              comparisonResult.isValid
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {comparisonResult.isValid ? (
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h3
                  className={`text-lg font-semibold ${
                    comparisonResult.isValid
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}
                >
                  {comparisonResult.isValid
                    ? '✅ Response is Valid!'
                    : '❌ Response has Issues'}
                </h3>
                {!comparisonResult.isValid && (
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>
                      Total Errors: <strong>{comparisonResult.summary.totalErrors}</strong>
                    </p>
                    {comparisonResult.summary.missingCount > 0 && (
                      <p>
                        Missing Properties: <strong>{comparisonResult.summary.missingCount}</strong>
                      </p>
                    )}
                    {comparisonResult.summary.typeMismatchCount > 0 && (
                      <p>
                        Type Mismatches:{' '}
                        <strong>{comparisonResult.summary.typeMismatchCount}</strong>
                      </p>
                    )}
                    {comparisonResult.summary.extraCount > 0 && (
                      <p>
                        Extra Properties: <strong>{comparisonResult.summary.extraCount}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Details */}
          {!comparisonResult.isValid && comparisonResult.errors.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Issues Found:
              </h4>
              <div className="space-y-3">
                {comparisonResult.errors.map((err, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getErrorColor(err.type)}`}
                  >
                    <div className="flex items-start">
                      <span className="text-xl mr-3 flex-shrink-0">
                        {getErrorIcon(err.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold mb-1">
                          {err.type.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-sm mb-2">{err.message}</p>
                        <div className="text-xs font-mono bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">
                          <p className="truncate">
                            <strong>Path:</strong> {err.path}
                          </p>
                          {err.expected !== undefined && (
                            <p className="truncate">
                              <strong>Expected:</strong>{' '}
                              {typeof err.expected === 'object'
                                ? JSON.stringify(err.expected)
                                : err.expected}
                            </p>
                          )}
                          {err.actual !== undefined && (
                            <p className="truncate">
                              <strong>Actual:</strong>{' '}
                              {typeof err.actual === 'object'
                                ? JSON.stringify(err.actual)
                                : err.actual}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
