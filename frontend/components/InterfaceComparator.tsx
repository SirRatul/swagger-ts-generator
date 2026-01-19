import { useState, useMemo } from 'react';
import { Endpoint, compareSwaggerVsTs, ComparisonResult } from '../lib/api';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import Editor from '@monaco-editor/react';

interface InterfaceComparatorProps {
  endpoints: Endpoint[];
  swaggerJson: any;
}

export default function InterfaceComparator({
  endpoints,
  swaggerJson,
}: InterfaceComparatorProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tsCode, setTsCode] = useState<string>('interface MyResponse {\n  // Paste your TypeScript interface here\n}');
  const [comparisonType, setComparisonType] = useState<'request' | 'response'>('response');
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedInterfaceName, setSelectedInterfaceName] = useState<string>('');

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

    if (!tsCode.trim()) {
      setError('Please enter TypeScript code to compare');
      return;
    }

    setLoading(true);

    try {
      const result = await compareSwaggerVsTs(
        selectedEndpoint,
        tsCode,
        swaggerJson,
        endpoints,
        comparisonType
      );
      setComparisonResult(result.comparison);
      setSelectedInterfaceName(result.selectedInterfaceName);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to compare. Please check your input.'
      );
    } finally {
      setLoading(false);
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

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-100 dark:border-gray-800">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2">
          🔄 TypeScript Interface Comparator
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Check if your TypeScript interface is up-to-date with the Swagger API definition.
        </p>
      </div>

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center items-start gap-3 sm:gap-6 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
           <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Compare Type:</span>
           <div className="flex items-center gap-6">
               <label className="flex items-center cursor-pointer">
                 <input 
                   type="radio" 
                   checked={comparisonType === 'response'} 
                   onChange={() => setComparisonType('response')}
                   className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                 />
                 <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Response</span>
               </label>
               <label className="flex items-center cursor-pointer">
                 <input 
                   type="radio" 
                   checked={comparisonType === 'request'} 
                   onChange={() => setComparisonType('request')}
                   className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                 />
                 <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Request Payload</span>
               </label>
           </div>
        </div>

        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">1. Select Endpoint</h3>
        <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search endpoints..."
            className="w-full mb-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-200"
        />
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

      {/* Code Editor */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">2. Paste Your TypeScript Interface</h3>
        <div className="h-64 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="typescript"
            value={tsCode}
            onChange={(value) => setTsCode(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
            }}
          />
        </div>
      </div>

      {/* Compare Button */}
      <button
        onClick={handleCompare}
        disabled={loading || !selectedEndpoint}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {loading ? 'Comparing...' : 'Compare Interfaces'}
      </button>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg">
          {error}
        </div>
      )}

      {/* Results */}
      {comparisonResult && (
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
             <p className="text-sm text-gray-600 dark:text-gray-400">
                 Comparing Swagger Definition against TypeScript Interface: <span className="font-mono font-bold text-gray-800 dark:text-white">{selectedInterfaceName}</span>
             </p>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Added */}
                <div className="border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/10 rounded-lg p-4">
                    <h4 className="flex items-center text-green-800 dark:text-green-300 font-semibold mb-3">
                        <span className="mr-2">➕</span> Missing in TS (Add these)
                    </h4>
                    {comparisonResult.added.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">None</p>
                    ) : (
                        <ul className="space-y-2">
                            {comparisonResult.added.map((item, idx) => (
                                <li key={idx} className="text-sm border-b border-green-100 dark:border-green-800/50 pb-2 last:border-0">
                                    <div className="font-mono text-green-700 dark:text-green-400 font-bold">{item.name}</div>
                                    <div className="text-xs text-green-600 dark:text-green-500">Type: {item.type}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Removed */}
                <div className="border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10 rounded-lg p-4">
                    <h4 className="flex items-center text-red-800 dark:text-red-300 font-semibold mb-3">
                        <span className="mr-2">➖</span> Extra in TS (Remove these)
                    </h4>
                    {comparisonResult.removed.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">None</p>
                    ) : (
                         <ul className="space-y-2">
                            {comparisonResult.removed.map((item, idx) => (
                                <li key={idx} className="text-sm border-b border-red-100 dark:border-red-800/50 pb-2 last:border-0">
                                    <div className="font-mono text-red-700 dark:text-red-400 font-bold">{item.name}</div>
                                    <div className="text-xs text-red-600 dark:text-red-500">Type: {item.type}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Modified */}
                <div className="border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg p-4">
                    <h4 className="flex items-center text-yellow-800 dark:text-yellow-300 font-semibold mb-3">
                        <span className="mr-2">⚠️</span> Mismatch (Modify these)
                    </h4>
                     {comparisonResult.modified.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">None</p>
                    ) : (
                        <ul className="space-y-2">
                             {comparisonResult.modified.map((item, idx) => (
                                <li key={idx} className="text-sm border-b border-yellow-100 dark:border-yellow-800/50 pb-2 last:border-0">
                                    <div className="font-mono text-yellow-700 dark:text-yellow-400 font-bold break-all">{item.name}</div>
                                    <div className="text-xs break-all">
                                        <span className="text-red-500 line-through mr-2">{item.actualType}</span>
                                        <span className="text-green-600">→ {item.expectedType}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
