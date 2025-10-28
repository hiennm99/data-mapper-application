import type { ColumnMapping, DestinationTable,SourceColumn } from "@types";
import React, { useCallback,useState } from 'react';

export const useMappingLogic = () => {
    const [mappings, setMappings] = useState<ColumnMapping[]>([]);
    const [draggedItem, setDraggedItem] = useState<SourceColumn | null>(null);

    // Helper function to check if a file has any mappings
    const isFileMapped = useCallback((fileName: string): boolean => {
        return mappings.some(mapping => mapping.source.file === fileName);
    }, [mappings]);

    // Helper function to check if a sheet has any mappings
    const isSheetMapped = useCallback((fileName: string, sheetName: string): boolean => {
        return mappings.some(mapping =>
            mapping.source.file === fileName && mapping.source.sheet === sheetName
        );
    }, [mappings]);

    // Helper function to get the count of mappings for a file
    const getFileMappingCount = useCallback((fileName: string): number => {
        return mappings.filter(mapping => mapping.source.file === fileName).length;
    }, [mappings]);

    // Helper function to get the count of mappings for a sheet
    const getSheetMappingCount = useCallback((fileName: string, sheetName: string): number => {
        return mappings.filter(mapping =>
            mapping.source.file === fileName && mapping.source.sheet === sheetName
        ).length;
    }, [mappings]);

    // Helper function to check if a column is mapped
    const isColumnMapped = useCallback((fileName: string, sheetName: string, columnName: string): boolean => {
        return mappings.some(mapping =>
            mapping.source.file === fileName &&
            mapping.source.sheet === sheetName &&
            mapping.source.value === columnName
        );
    }, [mappings]);

    // Helper function to get mapping count for a column
    const getColumnMappingCount = useCallback((fileName: string, sheetName: string, columnName: string): number => {
        return mappings.filter(mapping =>
            mapping.source.file === fileName &&
            mapping.source.sheet === sheetName &&
            mapping.source.value === columnName
        ).length;
    }, [mappings]);

    // Helper function to check if a destination column is already mapped
    const isDestinationMapped = useCallback((destinationTable: string, destinationColumn: string): boolean => {
        return mappings.some(mapping =>
            mapping.destination.table === destinationTable &&
            mapping.destination.column === destinationColumn
        );
    }, [mappings]);

    // Drag and Drop handlers
    const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, item: SourceColumn): void => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'copy';
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    const handleDrop = useCallback((
        e: React.DragEvent<HTMLDivElement>,
        destinationTable: DestinationTable,
        destinationColumn: string
    ): void => {
        e.preventDefault();
        if (draggedItem) {
            // Check if destination column is already mapped
            const existingMapping = mappings.find(m =>
                m.destination.table === destinationTable.name &&
                m.destination.column === destinationColumn
            );

            if (existingMapping) {
                // Replace the existing mapping instead of adding a new one
                const mapping: ColumnMapping = {
                    id: crypto.randomUUID(),
                    source: draggedItem,
                    destination: {
                        table: destinationTable.name,
                        column: destinationColumn
                    }
                };

                // Remove old mapping and add new one
                setMappings(prev => [
                    ...prev.filter(m => m.id !== existingMapping.id),
                    mapping
                ]);
            } else {
                // Add new mapping if destination is not mapped yet
                const mapping: ColumnMapping = {
                    id: crypto.randomUUID(),
                    source: draggedItem,
                    destination: {
                        table: destinationTable.name,
                        column: destinationColumn
                    }
                };
                setMappings(prev => [...prev, mapping]);
            }

            setDraggedItem(null);
        }
    }, [draggedItem, mappings]);

    const removeMapping = useCallback((mappingId: string): void => {
        setMappings(prev => prev.filter(m => m.id !== mappingId));
    }, []);

    return {
        // State
        mappings,
        setMappings,
        draggedItem,
        setDraggedItem,

        // File/Sheet/Column helpers
        isFileMapped,
        isSheetMapped,
        getFileMappingCount,
        getSheetMappingCount,
        isColumnMapped,
        getColumnMappingCount,
        isDestinationMapped,

        // Drag and Drop
        handleDragStart,
        handleDragOver,
        handleDrop,
        removeMapping
    };
};