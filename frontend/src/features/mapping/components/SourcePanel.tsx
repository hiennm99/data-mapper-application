// components/SourcePanel.tsx - Fixed column filtering issue
import type {FileData, SourceColumn} from '@types';
import { Check, ChevronDown, ChevronRight, Columns, Database, File, Search, Sheet, X } from 'lucide-react';
import React from "react";

interface SourceDataPanelProps {
    jsonData: FileData[];
    expandedNodes: Set<string>;
    onToggleNode: (path: string) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, item: SourceColumn) => void;
    isFileMapped: (fileName: string) => boolean;
    isSheetMapped: (fileName: string, sheetName: string) => boolean;
    getFileMappingCount: (fileName: string) => number;
    getSheetMappingCount: (fileName: string, sheetName: string) => number;
    isColumnMapped: (fileName: string, sheetName: string, columnName: string) => boolean;
    getColumnMappingCount: (fileName: string, sheetName: string, columnName: string) => number;
    // Filter props - debounced value for filtering
    globalFilter: string;
    onGlobalFilterChange: (value: string) => void;
    // Optional: input value for immediate feedback (defaults to globalFilter if not provided)
    inputValue?: string;
}

export const SourcePanel: React.FC<SourceDataPanelProps> = ({
                                                                    jsonData,
                                                                    expandedNodes,
                                                                    onToggleNode,
                                                                    onDragStart,
                                                                    isFileMapped,
                                                                    isSheetMapped,
                                                                    getFileMappingCount,
                                                                    getSheetMappingCount,
                                                                    isColumnMapped,
                                                                    getColumnMappingCount,
                                                                    globalFilter,
                                                                    onGlobalFilterChange,
                                                                    inputValue
                                                                }) => {
    // Use inputValue for input field (immediate), globalFilter for filtering (debounced)
    const displayValue = inputValue !== undefined ? inputValue : globalFilter;
    // Enhanced filter function for columns that preserves original indices
    const getFilteredColumnsWithIndices = (columns: string[]): Array<{column: string, originalIndex: number}> => {
        if (!globalFilter.trim()) {
            return columns.map((column, index) => ({column, originalIndex: index}));
        }
        return columns
            .map((column, index) => ({column, originalIndex: index}))
            .filter(item => item.column.toLowerCase().includes(globalFilter.toLowerCase()));
    };

    // Filter function for sheets (shows sheet if it has matching columns or if sheet name matches OR if parent file matches)
    const shouldShowSheet = (sheet: { sheet_name: string; columns?: string[] }, _fileName: string, fileMatches: boolean): boolean => {
        if (!globalFilter.trim()) {
            return true;
        }

        // If parent file matches, show all sheets
        if (fileMatches) {
            return true;
        }

        const sheetNameMatches = sheet.sheet_name.toLowerCase().includes(globalFilter.toLowerCase());
        const hasMatchingColumns = sheet.columns && getFilteredColumnsWithIndices(sheet.columns).length > 0;

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        return sheetNameMatches || hasMatchingColumns;
    };

    // Filter function for files (shows file if filename matches or has matching sheets)
    const shouldShowFile = (fileData: FileData): boolean => {
        if (!globalFilter.trim()) {
            return true;
        }

        const fileName = fileData.file.split('\\').pop() || fileData.file;
        const fileNameMatches = fileName.toLowerCase().includes(globalFilter.toLowerCase());

        // If filename matches, show the file
        if (fileNameMatches) {
            return true;
        }

        // Otherwise check if any sheet has matching content
        const hasMatchingSheets = fileData.sheets.some(sheet => {
            const sheetNameMatches = sheet.sheet_name.toLowerCase().includes(globalFilter.toLowerCase());
            const hasMatchingColumns = sheet.columns && getFilteredColumnsWithIndices(sheet.columns).length > 0;
            return sheetNameMatches || hasMatchingColumns;
        });

        return hasMatchingSheets;
    };

    // Filter the data
    const filteredJsonData = jsonData.filter(fileData => shouldShowFile(fileData));

    return (
        <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-blue-700 text-white p-4 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                <h2 className="text-lg font-semibold">Source Data Structure</h2>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 border-b border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search files, sheets, and columns..."
                        value={displayValue}
                        onChange={(e) => onGlobalFilterChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    {displayValue && (
                        <button
                            onClick={() => onGlobalFilterChange('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        </button>
                    )}
                </div>
                {globalFilter && (
                    <div className="mt-2 text-sm text-gray-600">
                        Found results in {filteredJsonData.length} file{filteredJsonData.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
                <div className="space-y-4">
                    {filteredJsonData.map((fileData, fileIndex) => {
                        const fileName = fileData.file.split('\\').pop() || fileData.file;
                        const fileKey = `file-${fileIndex}`;
                        const isMappedFile = isFileMapped(fileName);
                        const fileMappingCount = getFileMappingCount(fileName);

                        // Filter sheets for this file
                        const fileNameMatches = fileName.toLowerCase().includes(globalFilter.toLowerCase());
                        const filteredSheets = fileData.sheets.filter(sheet => shouldShowSheet(sheet, fileName, fileNameMatches));

                        return (
                            <div key={fileIndex} className="bg-white rounded-lg shadow-sm border border-gray-200">
                                {/* File Header - With mapping status styling */}
                                <div
                                    className={`border-b border-gray-200 p-4 cursor-pointer transition-colors ${
                                        isMappedFile
                                            ? 'bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100'
                                            : 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100'
                                    }`}
                                    onClick={() => onToggleNode(fileKey)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {expandedNodes.has(fileKey) ?
                                                <ChevronDown className={`w-5 h-5 mr-2 ${isMappedFile ? 'text-red-600' : 'text-blue-600'}`} /> :
                                                <ChevronRight className={`w-5 h-5 mr-2 ${isMappedFile ? 'text-red-600' : 'text-blue-600'}`} />
                                            }
                                            <File className={`w-5 h-5 mr-3 ${isMappedFile ? 'text-red-600' : 'text-blue-600'}`} />
                                            <div>
                                                <h3 className="font-semibold text-gray-800 text-lg">{fileName}</h3>
                                                <p className="text-sm text-gray-500 mt-1">{fileData.file}</p>
                                                <div className="flex items-center mt-2 space-x-4">
                                                    <div className="flex items-center">
                                                        <Sheet className="w-4 h-4 text-gray-400 mr-1" />
                                                        <span className="text-sm text-gray-600">
                                                            {globalFilter ? `${filteredSheets.length}/${fileData.sheets.length}` : fileData.sheets.length} sheets
                                                            {globalFilter && filteredSheets.length !== fileData.sheets.length && (
                                                                <span className="text-blue-600 font-medium"> (filtered)</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    {isMappedFile && (
                                                        <div className="flex items-center">
                                                            <Check className="w-4 h-4 text-red-600 mr-1" />
                                                            <span className="text-sm text-red-600 font-medium">
                                                                {fileMappingCount} mapping{fileMappingCount > 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {isMappedFile && (
                                            <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                                                Mapped
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Sheets Content */}
                                {expandedNodes.has(fileKey) && (
                                    <div className="p-4">
                                        <div className="space-y-3">
                                            {filteredSheets.map((sheet, sheetIndex) => {
                                                const sheetKey = `${fileKey}-sheet-${sheetIndex}`;
                                                const hasColumns = sheet.columns && sheet.columns.length > 0;
                                                const isMappedSheet = isSheetMapped(fileName, sheet.sheet_name);
                                                const sheetMappingCount = getSheetMappingCount(fileName, sheet.sheet_name);

                                                // Filter columns for this sheet with original indices
                                                // Show all columns if: file matches, sheet name matches, or filter columns normally
                                                const sheetNameMatches = sheet.sheet_name.toLowerCase().includes(globalFilter.toLowerCase());
                                                const filteredColumnsWithIndices = hasColumns ?
                                                    (fileNameMatches || sheetNameMatches ?
                                                            sheet.columns.map((column, index) => ({column, originalIndex: index})) :
                                                            getFilteredColumnsWithIndices(sheet.columns)
                                                    ) : [];

                                                return (
                                                    <div key={sheetIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                                                        {/* Sheet Header - With mapping status styling */}
                                                        <div
                                                            className={`p-3 cursor-pointer transition-colors ${
                                                                isMappedSheet
                                                                    ? 'bg-red-50 hover:bg-red-100'
                                                                    : 'bg-gray-50 hover:bg-gray-100'
                                                            }`}
                                                            onClick={() => onToggleNode(sheetKey)}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center">
                                                                    {hasColumns ? (
                                                                        expandedNodes.has(sheetKey) ?
                                                                            <ChevronDown className={`w-4 h-4 mr-2 ${isMappedSheet ? 'text-red-600' : 'text-gray-600'}`} /> :
                                                                            <ChevronRight className={`w-4 h-4 mr-2 ${isMappedSheet ? 'text-red-600' : 'text-gray-600'}`} />
                                                                    ) : (
                                                                        <div className="w-4 h-4 mr-2" />
                                                                    )}
                                                                    <Sheet className={`w-4 h-4 mr-2 ${isMappedSheet ? 'text-red-600' : 'text-gray-600'}`} />
                                                                    <span className={`font-medium ${isMappedSheet ? 'text-red-800' : 'text-gray-800'}`}>
                                                                        {sheet.sheet_name}
                                                                    </span>
                                                                    {isMappedSheet && (
                                                                        <div className="ml-2 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                                                                            {sheetMappingCount} mapped
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="flex items-center">
                                                                        <div className={`w-3 h-3 rounded-full mr-2 ${sheet.have_header ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                                                        <span className="text-sm text-gray-600">
                                                                            {sheet.have_header ? 'Has Header' : 'No Header'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                        <Columns className="w-4 h-4 text-gray-500 mr-1" />
                                                                        <span className="text-sm text-gray-600">
                                                                            {globalFilter && hasColumns ?
                                                                                `${filteredColumnsWithIndices.length}/${sheet.columns?.length || 0}` :
                                                                                (sheet.columns?.length || 0)
                                                                            } columns
                                                                            {globalFilter && hasColumns && filteredColumnsWithIndices.length !== sheet.columns.length && (
                                                                                <span className="text-blue-600 font-medium"> (filtered)</span>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Columns Content */}
                                                        {hasColumns && expandedNodes.has(sheetKey) && (
                                                            <div className="p-4 bg-white">
                                                                <div className="mb-3">
                                                                    <div className="flex items-center mb-2">
                                                                        <Columns className="w-4 h-4 text-green-600 mr-2" />
                                                                        <span className="text-sm font-medium text-gray-700">Available Columns:</span>
                                                                        {globalFilter && filteredColumnsWithIndices.length !== sheet.columns.length && (
                                                                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                                                {filteredColumnsWithIndices.length} of {sheet.columns.length} shown
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {filteredColumnsWithIndices.length > 0 ? (
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                        {filteredColumnsWithIndices.map(({column, originalIndex}, displayIndex) => {
                                                                            const isMapped = isColumnMapped(fileName, sheet.sheet_name, column);
                                                                            const mappingCount = getColumnMappingCount(fileName, sheet.sheet_name, column);

                                                                            return (
                                                                                <div
                                                                                    key={displayIndex}
                                                                                    className={`border rounded-lg px-3 py-2 cursor-grab transition-all duration-200 transform hover:scale-105 ${
                                                                                        isMapped
                                                                                            ? 'bg-red-50 border-red-300 hover:bg-red-100 hover:border-red-400'
                                                                                            : 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300'
                                                                                    }`}
                                                                                    draggable
                                                                                    onDragStart={(e) => onDragStart(e, {
                                                                                        value: column,
                                                                                        file: fileName,
                                                                                        sheet: sheet.sheet_name
                                                                                    })}
                                                                                >
                                                                                    <div className="flex items-center justify-between">
                                                                                        <div className="flex items-center">
                                                                                            <div className={`w-2 h-2 rounded-full mr-2 ${
                                                                                                isMapped ? 'bg-red-500' : 'bg-green-500'
                                                                                            }`}>
                                                                                            </div>
                                                                                            <div className="flex flex-col">
                                                                                                <span className={`font-medium text-sm ${
                                                                                                    isMapped ? 'text-red-800' : 'text-green-800'
                                                                                                }`}>{column}</span>
                                                                                                <span className='text-xs text-gray-500'>
                                                                                                    {sheet.sample_data && sheet.sample_data[originalIndex]}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                        {isMapped && (
                                                                                            <div className="flex items-center">
                                                                                                <Check className="w-4 h-4 text-red-600" />
                                                                                                {mappingCount > 1 && (
                                                                                                    <span className="ml-1 text-xs bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                                                                                                        {mappingCount}
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className={`text-xs mt-1 ${
                                                                                        isMapped ? 'text-red-600' : 'text-green-600'
                                                                                    }`}>
                                                                                        {isMapped && (
                                                                                            <span className="ml-2 font-medium">
                                                                                                ✓ Mapped
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ) : (
                                                                    <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                                                                        <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                                                        <div className="text-sm">No columns match your search</div>
                                                                        <div className="text-xs text-gray-400">Try adjusting your search term</div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Empty State for sheets without columns */}
                                                        {!hasColumns && (
                                                            <div className="p-4 text-center text-gray-500">
                                                                <Columns className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                                                <div className="text-sm">No columns available</div>
                                                                <div className="text-xs text-gray-400">This sheet appears to be empty or has no defined structure</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Empty state when no results found */}
                    {globalFilter && filteredJsonData.length === 0 && (
                        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center p-12">
                            <div className="text-center">
                                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-gray-500 font-medium mb-2">No results found</h3>
                                <p className="text-gray-400 text-sm">No files, sheets, or columns match "{globalFilter}"</p>
                                <button
                                    onClick={() => onGlobalFilterChange('')}
                                    className="mt-3 text-blue-600 hover:text-blue-800 text-sm underline"
                                >
                                    Clear search
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Empty state when no data */}
                    {!globalFilter && filteredJsonData.length === 0 && (
                        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center p-12">
                            <div className="text-center">
                                <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-gray-500 font-medium mb-2">No source data</h3>
                                <p className="text-gray-400 text-sm">Upload your files to get started</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};