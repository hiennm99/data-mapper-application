// MappingPage.tsx - Feature-based architecture
// Feature-specific hooks
import { useDestinationTables, useExportLogic,useMappingLogic } from '@features/mapping';
// Types
import type { FileData } from '@types';
import { Loader2, Save, Table, Upload } from 'lucide-react';
import React, { useCallback,useState } from 'react';

// Shared components
import { Navbar, ToastNotification } from '../../../components';
import { useDebounce } from '../../../hooks';
// Feature-specific components
import { 
    DestinationPanel, 
    ExcelUploader, 
    PanelHeader,
    ParsingOverlay,
    SavingOverlay, 
    SourcePanel} from '../components';

const MappingPage: React.FC = () => {
    const [jsonData, setJsonData] = useState<FileData[]>([]);
    const [isUploadLoading, setIsUploadLoading] = useState(false);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [sourceGlobalFilter, setSourceGlobalFilter] = useState<string>('');
    const debouncedSourceFilter = useDebounce(sourceGlobalFilter, 300);
    const [, setExportMessage] = useState<string>('');

    // Custom hooks
    const {
        mappings,
        setMappings,
        isFileMapped,
        isSheetMapped,
        getFileMappingCount,
        getSheetMappingCount,
        isColumnMapped,
        getColumnMappingCount,
        handleDragStart,
        handleDragOver,
        handleDrop,
        removeMapping
    } = useMappingLogic();

    const {
        destinationTables,
        globalFilter: destinationGlobalFilter,
        setGlobalFilter: setDestinationGlobalFilter,
        getFilteredColumns
    } = useDestinationTables();

    const {
        isExporting,
        exportMessage,
        exportMappings
    } = useExportLogic();

    // Handler for when ExcelUploader loads schema data
    const handleSchemaLoaded = useCallback((schemas: FileData[]) => {
        console.log('Schema loaded:', schemas);
        setJsonData(schemas);
        if (schemas.length > 0) {
            setExpandedNodes(new Set(['file-0']));
        }
    }, []);

    // Handler to go back to upload
    const handleBackToUpload = useCallback(() => {
        setJsonData([]);
        setMappings([]);
        setExpandedNodes(new Set());
        setSourceGlobalFilter('');
    }, [setMappings]);

    // Local state handlers
    const toggleNode = useCallback((path: string): void => {
        setExpandedNodes(prev => {
            const newExpanded = new Set(prev);
            if (newExpanded.has(path)) {
                newExpanded.delete(path);
            } else {
                newExpanded.add(path);
            }
            return newExpanded;
        });
    }, []);

    const handleSave = useCallback(async (): Promise<void> => {
        try {
            if (!mappings || mappings.length === 0) {
                setExportMessage('No mappings to save. Please create some mappings first.');
                setTimeout(() => setExportMessage(''), 3000);
                return;
            }

            const result = await exportMappings(mappings);

            if (result) {
                console.log('Export successful, clearing mappings only...');
                setTimeout(() => {
                    setMappings([]);
                    console.log('Mappings cleared, ready for new mappings');
                }, 1000);
            }
        } catch (error) {
            console.error('Save failed:', error);
        }
    }, [exportMappings, mappings, setMappings]);

    // Helper function to get mapping count for display
    const getMappingCountDisplay = useCallback((): string => {
        const count = mappings.length;
        if (count === 0) return 'No mappings';
        if (count === 1) return '1 mapping';
        return `${count} mappings`;
    }, [mappings.length]);

    return (
        <>
            <Navbar />
            <div className="h-screen flex bg-gray-50 relative">
                {/* Loading Overlay */}
                <SavingOverlay isVisible={isExporting} />
                <ParsingOverlay isVisible={isUploadLoading} />

                {/* Toast Notification */}
                <ToastNotification
                    message={exportMessage}
                    isVisible={!!exportMessage}
                />

                {/* Conditional rendering based on whether data is loaded */}
                {jsonData.length === 0 ? (
                    // Show ExcelUploader when no data
                    <div className="w-full flex items-center justify-center">
                        <ExcelUploader
                            onSchemaLoaded={handleSchemaLoaded}
                            isLoading={isUploadLoading}
                            setIsLoading={setIsUploadLoading}
                        />
                    </div>
                ) : (
                    // Show mapping interface when data is loaded
                    <>
                        {/* Source Data Panel with Filter */}
                        <SourcePanel
                            jsonData={jsonData}
                            expandedNodes={expandedNodes}
                            onToggleNode={toggleNode}
                            onDragStart={handleDragStart}
                            isFileMapped={isFileMapped}
                            isSheetMapped={isSheetMapped}
                            getFileMappingCount={getFileMappingCount}
                            getSheetMappingCount={getSheetMappingCount}
                            isColumnMapped={isColumnMapped}
                            getColumnMappingCount={getColumnMappingCount}
                            globalFilter={debouncedSourceFilter}
                            onGlobalFilterChange={setSourceGlobalFilter}
                            inputValue={sourceGlobalFilter}
                        />

                        {/* Destination Tables Panel */}
                        <div className="w-2/3">
                            <PanelHeader
                                icon={Table}
                                title="Destination Tables"
                                gradient="bg-gradient-to-r from-teal-500 via-emerald-600 to-green-600"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Back to Upload button */}
                                    <button
                                        onClick={handleBackToUpload}
                                        className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 text-sm flex items-center transition-colors rounded-lg"
                                        title="Upload different files"
                                    >
                                        <Upload className="w-4 h-4 mr-1" />
                                        Upload New Files
                                    </button>

                                    {/* Mapping count indicator */}
                                    <span className="text-sm text-white/80 bg-white/20 px-2 py-1 rounded">
                                        {getMappingCountDisplay()}
                                    </span>

                                    {/* Save button */}
                                    <button
                                        onClick={handleSave}
                                        disabled={isExporting || mappings.length === 0}
                                        className="bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-white hover:from-amber-600 hover:via-orange-700 hover:to-red-700 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 text-sm flex items-center transition-colors rounded-lg"
                                        title={mappings.length === 0 ? "No mappings to save" : "Save current mappings"}
                                    >
                                        {isExporting ? (
                                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4 mr-1 text-white" />
                                        )}
                                        {isExporting ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </PanelHeader>

                            <DestinationPanel
                                destinationTables={destinationTables}
                                mappings={mappings}
                                globalFilter={destinationGlobalFilter}
                                onGlobalFilterChange={setDestinationGlobalFilter}
                                getFilteredColumns={getFilteredColumns}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onRemoveMapping={removeMapping}
                            />
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export { MappingPage };
