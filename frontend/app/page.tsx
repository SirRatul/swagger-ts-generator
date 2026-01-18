'use client';

import { useState } from 'react';
import UrlInput from '../components/UrlInput';
import EndpointSelector from '../components/EndpointSelector';
import OutputViewer from '../components/OutputViewer';
import ThemeToggle from '../components/ThemeToggle';
import LoadingOverlay from '../components/LoadingOverlay';
import { 
	fetchSwaggerEndpoints, 
	generateTypeScript, 
	Endpoint 
} from '../lib/api';
import InterfaceComparator from '../components/InterfaceComparator';

export default function Home() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [swaggerJson, setSwaggerJson] = useState<any>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [fetchLoading, setFetchLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFetchEndpoints = async (url: string, authHeader?: string) => {
    setFetchLoading(true);
    setError('');
    setEndpoints([]);
    setGeneratedCode('');
    setSwaggerJson(null);

    try {
      const data = await fetchSwaggerEndpoints(url, authHeader);
      setEndpoints(data.endpoints);
      setSwaggerJson(data.swaggerJson);
    } catch (err: any) {
      setError(
        err.response?.data?.error || 
        err.message || 
        'Failed to fetch Swagger specification. Please check the URL and try again.'
      );
    } finally {
      setFetchLoading(false);
    }
  };

  const handleGenerate = async (selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      setError('Please select at least one endpoint');
      return;
    }

    setGenerateLoading(true);
    setError('');

    try {
      const data = await generateTypeScript(selectedIds, endpoints, swaggerJson);
      setGeneratedCode(data.typescript);
    } catch (err: any) {
      setError(
        err.response?.data?.error || 
        err.message || 
        'Failed to generate TypeScript code. Please try again.'
      );
    } finally {
      setGenerateLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6 lg:px-8 transition-colors duration-300">
      <LoadingOverlay 
        isLoading={fetchLoading || generateLoading} 
        message={fetchLoading ? 'Fetching Endpoints...' : 'Generating TypeScript...'} 
      />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>

        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <div className="inline-flex items-center justify-center p-2 sm:p-3 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl sm:rounded-2xl shadow-lg mb-3 sm:mb-4">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">
            Swagger TypeScript Generator
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
            Transform your Swagger/OpenAPI specifications into clean, type-safe TypeScript interfaces
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg shadow-sm">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-red-800 dark:text-red-200 font-semibold text-sm sm:text-base mb-1">Error</h3>
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6 sm:space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2">
              ⚡ TypeScript Interface Generator
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-4">
              Generate TypeScript interfaces from your Swagger/OpenAPI URL.
            </p>
            <UrlInput onFetch={handleFetchEndpoints} loading={fetchLoading} />
          </div>

          {endpoints.length > 0 && (
            <EndpointSelector
              endpoints={endpoints}
              onGenerate={handleGenerate}
              loading={generateLoading}
            />
          )}

          {generatedCode && <OutputViewer code={generatedCode} />}

          {/* New Interface Comparator Section */}
          {endpoints.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
               <InterfaceComparator endpoints={endpoints} swaggerJson={swaggerJson} />
            </div>
          )}
        </div>

        {/* Footer */}

        <footer className="mt-12 sm:mt-16 text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm">
            Built with ❤️ using Next.js, TypeScript, and TailwindCSS
          </p>
        </footer>
      </div>
    </main>
  );
}
