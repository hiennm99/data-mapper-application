import {
    deleteMappingExport,
    ExportDetail,
    getMappingExports,
    getMappingStats,
    LoadingOverlay,
    searchMappingExports} from '@features/exports-manager';
import type { MappingExport, MappingExportResponse, Stats} from "@types";
import { AlertCircle, Calendar, CheckCircle, Clock, Database, Download, Eye, Filter, Loader, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { useCallback,useEffect, useMemo,useState } from 'react';
import { useNavigate } from "react-router-dom";

import { Navbar } from "../../../components";
import { useDebounce } from '../../../hooks';

const ExportsManagerPage = () => {
    const navigate = useNavigate();
    const [exports, setExports] = useState<MappingExport[]>([]);
    const [filteredExports, setFilteredExports] = useState<MappingExport[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [selectedExport, setSelectedExport] = useState<MappingExport | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [loadingType, setLoadingType] = useState<'loading' | 'error' | 'retrying'>('loading');
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [sortBy, setSortBy] = useState<'created_at' | 'name'>('created_at');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    
    // Advanced filters
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [selectedSheet, setSelectedSheet] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [selectedMappingType, setSelectedMappingType] = useState<string>('');
    const [error, setError] = useState('');
    const [, setStats] = useState<Stats>({
        total_mappings: 0,
        timestamp: new Date().toISOString()
    });

    // Helper function to convert backend response to internal format
    const convertBackendResponse = (data: MappingExportResponse[]): MappingExport[] => {
        return data.map(item => ({
            id: item.id,
            name: item.name,
            created_at: item.created_at,
            updated_at: item.updated_at,
            mappings: item.mappings
        }));
    };

    // Helper function to count total mappings
    const countMappingsInExport = (mappings: MappingExport['mappings']): number => {
        let count = 0;

        Object.entries(mappings).forEach(([key, value]) => {
            if (key === 'guarantors' || key === 'joints' || key === 'assets') {
                // These are arrays
                if (Array.isArray(value)) {
                    value.forEach(item => {
                        count += Object.keys(item).length;
                    });
                }
            } else {
                // Regular mapping
                count += 1;
            }
        });

        return count;
    };

    // Helper function to get unique tables from mappings
    const getUniqueTablesFromExport = (mappings: MappingExport['mappings']): Set<string> => {
        const tables = new Set<string>();

        Object.entries(mappings).forEach(([key, value]) => {
            if (key === 'guarantors' || key === 'joints' || key === 'assets') {
                // These are arrays
                if (Array.isArray(value)) {
                    value.forEach(item => {
                        Object.values(item).forEach(source => {
                            if (source && typeof source === 'object' && 'sheet' in source) {
                                tables.add(source.sheet);
                            }
                        });
                    });
                }
            } else {
                // Regular mapping
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    // value is { [key: string]: MappingSource }, get the first MappingSource
                    const mappingSource = Object.values(value)[0];
                    if (mappingSource && 'sheet' in mappingSource) {
                        tables.add(mappingSource.sheet);
                    }
                }
            }
        });

        return tables;
    };

    // Helper function to get files from export
    const getFilesFromExport = (mappings: MappingExport['mappings']): Set<string> => {
        const files = new Set<string>();

        Object.entries(mappings).forEach(([key, value]) => {
            if (key === 'guarantors' || key === 'joints' || key === 'assets') {
                // These are arrays
                if (Array.isArray(value)) {
                    value.forEach(item => {
                        Object.values(item).forEach(source => {
                            if (source && typeof source === 'object' && 'file' in source) {
                                files.add(source.file);
                            }
                        });
                    });
                }
            } else {
                // Regular mapping
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    // value is { [key: string]: MappingSource }, get the first MappingSource
                    const mappingSource = Object.values(value)[0];
                    if (mappingSource && 'file' in mappingSource) {
                        files.add(mappingSource.file);
                    }
                }
            }
        });

        return files;
    };

    // Smart local search function - searches in specific fields only
    const searchInExport = useCallback((exportItem: MappingExport, term: string): boolean => {
        const lowerTerm = term.toLowerCase();
        
        // Search in export name
        if (exportItem.name.toLowerCase().includes(lowerTerm)) {
            return true;
        }
        
        // Search in ID
        if (exportItem.id.toLowerCase().includes(lowerTerm)) {
            return true;
        }
        
        // Search in file names
        const files = getFilesFromExport(exportItem.mappings);
        if (Array.from(files).some(file => file.toLowerCase().includes(lowerTerm))) {
            return true;
        }
        
        // Search in sheet names
        const sheets = getUniqueTablesFromExport(exportItem.mappings);
        if (Array.from(sheets).some(sheet => sheet.toLowerCase().includes(lowerTerm))) {
            return true;
        }
        
        // Search in mapping keys (guarantors, joints, assets, base, etc.)
        const mappingKeys = Object.keys(exportItem.mappings);
        if (mappingKeys.some(key => key.toLowerCase().includes(lowerTerm))) {
            return true;
        }
        
        // Search in column names within mappings
        for (const [, value] of Object.entries(exportItem.mappings)) {
            if (Array.isArray(value)) {
                // For array mappings (guarantors, joints, assets)
                for (const item of value) {
                    for (const [field, source] of Object.entries(item)) {
                        if (field.toLowerCase().includes(lowerTerm)) {
                            return true;
                        }
                        if (source && typeof source === 'object' && 'column' in source) {
                            if (source.column.toLowerCase().includes(lowerTerm)) {
                                return true;
                            }
                        }
                    }
                }
            } else if (value && typeof value === 'object') {
                // For single mappings - value is { [key: string]: MappingSource }
                for (const [field, source] of Object.entries(value)) {
                    if (field.toLowerCase().includes(lowerTerm)) {
                        return true;
                    }
                    if (source && typeof source === 'object' && 'column' in source) {
                        if (source.column.toLowerCase().includes(lowerTerm)) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }, []);

    // Get unique files, sheets, and mapping types for filter dropdowns
    const { uniqueFiles, allSheets, uniqueMappingTypes } = useMemo(() => {
        const files = new Set<string>();
        const sheetsMap = new Map<string, Set<string>>(); // file -> sheets mapping
        const mappingTypes = new Set<string>();

        exports.forEach(exp => {
            // Collect files and their sheets
            const expFiles = getFilesFromExport(exp.mappings);

            expFiles.forEach(file => {
                files.add(file);
                
                // Map sheets to their files
                if (!sheetsMap.has(file)) {
                    sheetsMap.set(file, new Set<string>());
                }
                
                // Find which sheets belong to this file
                Object.entries(exp.mappings).forEach(([, value]) => {
                    if (Array.isArray(value)) {
                        value.forEach(item => {
                            Object.values(item).forEach(source => {
                                if (source && typeof source === 'object' && 'file' in source && 'sheet' in source) {
                                    if (source.file === file) {
                                        sheetsMap.get(file)!.add(source.sheet);
                                    }
                                }
                            });
                        });
                    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
                        const mappingSource = Object.values(value)[0];
                        if (mappingSource && mappingSource.file === file) {
                            sheetsMap.get(file)!.add(mappingSource.sheet);
                        }
                    }
                });
            });

            // Collect mapping types
            Object.keys(exp.mappings).forEach(key => mappingTypes.add(key));
        });

        return {
            uniqueFiles: Array.from(files).sort(),
            allSheets: sheetsMap,
            uniqueMappingTypes: Array.from(mappingTypes).sort()
        };
    }, [exports]);

    // Get sheets for selected file
    const availableSheets = useMemo(() => {
        if (!selectedFile) {
            // If no file selected, show all sheets
            const allSheetsSet = new Set<string>();
            allSheets.forEach(sheets => {
                sheets.forEach(sheet => allSheetsSet.add(sheet));
            });
            return Array.from(allSheetsSet).sort();
        }
        
        // Return sheets for selected file
        const sheets = allSheets.get(selectedFile);
        return sheets ? Array.from(sheets).sort() : [];
    }, [selectedFile, allSheets]);

    // Advanced filter function
    const applyAdvancedFilters = useCallback((exportsList: MappingExport[]): MappingExport[] => {
        return exportsList.filter(exp => {
            // File filter
            if (selectedFile) {
                const files = getFilesFromExport(exp.mappings);
                if (!files.has(selectedFile)) {
                    return false;
                }
            }

            // Sheet filter
            if (selectedSheet) {
                const sheets = getUniqueTablesFromExport(exp.mappings);
                if (!sheets.has(selectedSheet)) {
                    return false;
                }
            }

            // Date range filter
            const exportDate = new Date(exp.created_at);
            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                if (exportDate < fromDate) {
                    return false;
                }
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999); // End of day
                if (exportDate > toDate) {
                    return false;
                }
            }

            // Mapping type filter
            if (selectedMappingType) {
                if (!Object.keys(exp.mappings).includes(selectedMappingType)) {
                    return false;
                }
            }

            return true;
        });
    }, [selectedFile, selectedSheet, dateFrom, dateTo, selectedMappingType]);

    // Reset sheet when file changes
    useEffect(() => {
        if (selectedFile && selectedSheet) {
            // Check if selected sheet is still available for the new file
            const sheets = allSheets.get(selectedFile);
            if (sheets && !sheets.has(selectedSheet)) {
                setSelectedSheet(''); // Reset if sheet not in selected file
            }
        }
    }, [selectedFile, selectedSheet, allSheets]);

    // Check if any advanced filter is active
    const hasActiveFilters = selectedFile || selectedSheet || dateFrom || dateTo || selectedMappingType;

    // Clear all filters
    const clearAllFilters = () => {
        setSelectedFile('');
        setSelectedSheet('');
        setDateFrom('');
        setDateTo('');
        setSelectedMappingType('');
        setSearchTerm('');
    };

    // Retry function
    const handleRetry = () => {
        setLoadingType('retrying');
        setLoadingMessage('Retrying connection...');
        setTimeout(() => {
            void loadInitialData();
        }, 500);
    };

    const loadInitialData = useCallback(async () => {
        setIsInitialLoading(true);
        setLoadingType('loading');
        setLoadingMessage('Connecting to server...');
        setError('');

        try {
            // Load both exports and stats in parallel
            const [exportsData, statsData] = await Promise.all([
                getMappingExports(),
                getMappingStats()
            ]);

            setExports(convertBackendResponse(exportsData));
            setStats(statsData as Stats);
            setIsInitialLoading(false);
        } catch (error) {
            console.error('Failed to load initial data:', error);
            setLoadingType('error');
            setLoadingMessage('Unable to connect to the backend server. It might be starting up (Railway free tier takes 30-60s to wake up).');
            setIsInitialLoading(true);
        }
    }, []);

    // Initial data loading
    useEffect(() => {
        loadInitialData().catch(console.error);
    }, [loadInitialData]);

    // Filter exports based on debounced search term with AbortController
    useEffect(() => {
        const abortController = new AbortController();
        
        const performSearch = async () => {
            const trimmedTerm = debouncedSearchTerm.trim();
            
            // If empty search, show all exports
            if (!trimmedTerm) {
                setFilteredExports(exports);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);

            try {
                // Try API search first
                const searchResults = await searchMappingExports(trimmedTerm, abortController.signal);
                
                // Only update if not aborted
                if (!abortController.signal.aborted) {
                    setFilteredExports(convertBackendResponse(searchResults));
                    setIsSearching(false);
                }
            } catch (error) {
                // If aborted, don't do anything
                if (abortController.signal.aborted) {
                    return;
                }
                
                console.warn('API search failed, using local search:', error);
                
                // Fallback to optimized local filtering
                const filtered = exports.filter(exp => searchInExport(exp, trimmedTerm));
                setFilteredExports(filtered);
                setIsSearching(false);
            }
        };

        void performSearch();
        
        // Cleanup function
        return () => {
            abortController.abort();
        };
    }, [debouncedSearchTerm, exports, searchInExport]);

    // Apply advanced filters and sort exports
    const sortedExports = useMemo(() => {
        // First apply advanced filters
        const advancedFiltered = applyAdvancedFilters(filteredExports);
        
        // Then sort
        return [...advancedFiltered].sort((a, b) => {
            const aVal = sortBy === 'created_at' ? new Date(a.created_at).getTime() : a.name.toLowerCase();
            const bVal = sortBy === 'created_at' ? new Date(b.created_at).getTime() : b.name.toLowerCase();

            if (sortOrder === 'desc') {
                return aVal > bVal ? -1 : 1;
            }
            return aVal < bVal ? -1 : 1;
        });
    }, [applyAdvancedFilters, filteredExports, sortBy, sortOrder]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa export này không?')) {
            setIsLoading(true)
            try {
                await deleteMappingExport(id);
                setExports(prev => prev.filter(exp => exp.id !== id));
                setFilteredExports(prev => prev.filter(exp => exp.id !== id));

                // Update stats
                const updatedStats = await getMappingStats();
                setStats(updatedStats as Stats);

                alert('Đã xóa export thành công!');
            } catch (error: unknown) {
                console.error('Delete failed:', error);
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                alert(`Có lỗi xảy ra khi xóa export: ${error.message}`);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Handle Update Export
    const handleViewDetails = (exportItem: MappingExport) => {
        setSelectedExport(exportItem);
        setShowDetails(true);
    };

    const refreshExports = async () => {
        setIsLoading(true);
        setError('');

        try {
            const [exportsData, statsData] = await Promise.all([
                getMappingExports(),
                getMappingStats()
            ]);

            setExports(convertBackendResponse(exportsData));
            setStats(statsData as Stats);

            // Clear search term to show all data
            setSearchTerm('');

            alert('Đã Refresh danh sách thành công!');
        }
        catch (error: unknown) {
            console.error('Refresh failed:', error);
            setError('Không thể Refresh dữ liệu. Vui lòng thử lại sau.');
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            alert(`Có lỗi xảy ra khi Refresh: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadExport = (exportItem: MappingExport) => {
        const dataStr = JSON.stringify(exportItem, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `${exportItem.name.replace(/[^a-z0-9]/gi, '_')}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    // Calculate derived stats
    const totalMappings = exports.reduce((acc, exp) => acc + countMappingsInExport(exp.mappings), 0);

    // Calculate unique tables across all exports
    const allTables = new Set<string>();
    exports.forEach(exp => {
        const tables = getUniqueTablesFromExport(exp.mappings);
        tables.forEach(table => allTables.add(table));
    });
    const totalTables = allTables.size;

    const recentExports = exports.filter(exp =>
        new Date(exp.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    return (
      <>
        <Navbar />
        
        {/* Loading Overlay with error handling */}
        <LoadingOverlay
            isVisible={isInitialLoading}
            type={loadingType}
            message={loadingMessage}
            onRetry={loadingType === 'error' ? handleRetry : undefined}
        />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Mapping Exports Manager
                  </h1>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={refreshExports}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </button>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    onClick={() => navigate("/")}
                  >
                    <Plus className="w-4 h-4" />
                    Create New Export
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-red-800">{error}</span>
                  </div>
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Database className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Exports</p>
                      <p className="text-xl font-semibold">{exports.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Mappings</p>
                      <p className="text-xl font-semibold">{totalMappings}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Database className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Unique Sheets</p>
                      <p className="text-xl font-semibold">{totalTables}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Recent</p>
                      <p className="text-xl font-semibold">{recentExports}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  {isSearching && (
                    <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-4 h-4 animate-spin" />
                  )}
                  <input
                    type="text"
                    placeholder="Search by name, file, sheet, column..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                      hasActiveFilters
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                    title="Advanced Filters"
                  >
                    <Filter className="w-4 h-4" />
                    {hasActiveFilters && (
                      <span className="text-xs font-semibold">
                        (
                        {
                          [
                            selectedFile,
                            selectedSheet,
                            dateFrom,
                            dateTo,
                            selectedMappingType,
                          ].filter(Boolean).length
                        }
                        )
                      </span>
                    )}
                  </button>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "created_at" | "name")
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="created_at">Created Date</option>
                    <option value="name">Name</option>
                  </select>
                  <select
                    value={sortOrder}
                    onChange={(e) =>
                      setSortOrder(e.target.value as "desc" | "asc")
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="desc">Newest</option>
                    <option value="asc">Oldest</option>
                  </select>
                </div>
              </div>

              {/* Advanced Filters Panel */}
              {showAdvancedFilters && (
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Advanced Filters
                    </h3>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* File Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        File
                      </label>
                      <select
                        value={selectedFile}
                        onChange={(e) => setSelectedFile(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Files</option>
                        {uniqueFiles.map((file) => (
                          <option key={file} value={file}>
                            {file}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sheet Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Sheet
                      </label>
                      <select
                        value={selectedSheet}
                        onChange={(e) => setSelectedSheet(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        disabled={
                          !!(selectedFile && availableSheets.length === 0)
                        }
                      >
                        <option value="">
                          {selectedFile
                            ? `All Sheets (${availableSheets.length})`
                            : "All Sheets"}
                        </option>
                        {availableSheets.map((sheet: string) => (
                          <option key={sheet} value={sheet}>
                            {sheet}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Mapping Type Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Mapping Type
                      </label>
                      <select
                        value={selectedMappingType}
                        onChange={(e) => setSelectedMappingType(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Types</option>
                        {uniqueMappingTypes.map((type) => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date From */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Date To */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Results count */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Showing{" "}
                      <span className="font-semibold text-blue-600">
                        {sortedExports.length}
                      </span>{" "}
                      of <span className="font-semibold">{exports.length}</span>{" "}
                      exports
                      {hasActiveFilters && " (filtered)"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Exports List */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {sortedExports.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Not Found
                  </h3>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Export Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mappings
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedExports.map((exportItem) => {
                        const mappingCount = countMappingsInExport(
                          exportItem.mappings
                        );

                        return (
                          <tr
                            key={exportItem.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Database className="w-5 h-5 text-blue-600" />
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {exportItem.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {exportItem.id.slice(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {mappingCount} mappings
                                </span>
                                {Object.keys(exportItem.mappings).includes(
                                  "guarantors"
                                ) && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    guarantors
                                  </span>
                                )}
                                {Object.keys(exportItem.mappings).includes(
                                  "joints"
                                ) && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    joints
                                  </span>
                                )}
                                {Object.keys(exportItem.mappings).includes(
                                  "assets"
                                ) && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    assets
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {formatDate(exportItem.created_at)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleViewDetails(exportItem)}
                                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                  title="Xem chi tiết"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => downloadExport(exportItem)}
                                  className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(exportItem.id)}
                                  disabled={isLoading}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Details Modal */}
            <ExportDetail
              selectedExport={selectedExport}
              showDetails={showDetails}
              setShowDetails={setShowDetails}
              formatDate={formatDate}
            />

            {/* Loading Overlay */}
            {isLoading && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg flex items-center space-x-3">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                  <span>Processing...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
};

export default ExportsManagerPage;