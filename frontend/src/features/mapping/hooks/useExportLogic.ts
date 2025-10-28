import { BASE_COLUMNS,COLUMN_GROUPS } from '@config';
import { saveMappingExport } from '@features/exports-manager';
import { testMappingFormat } from '@features/mapping';
import type { ColumnMapping } from '@types';
import { useCallback,useState } from 'react';

interface MappingSource {
    file: string;
    sheet: string;
    column: string;
}

interface ServiceMappingData {
    name: string;
    mappings: {
        [key: string]: { [key: string]: MappingSource } | { [key: string]: MappingSource }[];
    };
}

export const useExportLogic = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState<string>('');

    // Helper function to create a proper MappingSource object
    const createMappingSource = useCallback((mapping: ColumnMapping): MappingSource | null => {
        if (!mapping || !mapping.source) {
            console.warn('Invalid mapping structure:', mapping);
            return null;
        }

        const file = mapping.source.file || '';
        const sheet = mapping.source.sheet || '';
        const column = mapping.source.value || '';

        // Return null if all fields are empty
        if (!file.trim() && !sheet.trim() && !column.trim()) {
            return null;
        }

        return {
            file: file.trim(),
            sheet: sheet.trim(),
            column: column.trim()
        };
    }, []);

    // Convert internal mappings to the new service format
    const convertToServiceFormat = useCallback((mappings: ColumnMapping[]): ServiceMappingData => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${year}_${month}_${day}_${hours}_${minutes}_${seconds}`;

        if (!mappings || mappings.length === 0) {
            console.warn('No mappings to export');
            return {
                name: `Mapping_Export____${timestamp}`,
                mappings: {}
            };
        }

        // Find fiscal_code mapping to extract file name for export name
        const fiscalCodeMapping = mappings.find(m => m.destination?.column === 'fiscal_code');
        const sourceFileName = fiscalCodeMapping?.source?.file 
            ? fiscalCodeMapping.source.file.split('\\').pop()?.replace(/\.[^/.]+$/, '') || 'Unknown'
            : 'Unknown';

        const result: ServiceMappingData = {
            name: `${sourceFileName}____${timestamp}`,
            mappings: {}
        };

        // Initialize group storage
        const groupMappings: { [groupKey: string]: { [instanceNumber: number]: { [field: string]: MappingSource } } } = {};
        const baseMappings: { [key: string]: MappingSource } = {};

        // Process all mappings
        mappings.forEach(mapping => {
            try {
                if (!mapping || !mapping.destination || !mapping.destination.column) {
                    console.warn('Skipping invalid mapping:', mapping);
                    return;
                }

                const destColumn = mapping.destination.column;
                const mappingSource = createMappingSource(mapping);

                // Skip empty mappings
                if (!mappingSource) {
                    return;
                }

                // Check if it's a base column
                if (BASE_COLUMNS.includes(destColumn)) {
                    baseMappings[destColumn] = mappingSource;
                    return;
                }

                // Check if it belongs to any group
                let matched = false;
                for (const group of COLUMN_GROUPS) {
                    if (group.isMultiInstance) {
                        // Pattern: prefix_number_field (e.g., address_1_street)
                        const regex = new RegExp(`^${group.prefix}_(\\d+)_(.+)$`);
                        const match = destColumn.match(regex);

                        if (match) {
                            const instanceNumber = parseInt(match[1]);
                            const fieldName = match[2];

                            if (!groupMappings[group.key]) {
                                groupMappings[group.key] = {};
                            }
                            if (!groupMappings[group.key][instanceNumber]) {
                                groupMappings[group.key][instanceNumber] = {};
                            }

                            groupMappings[group.key][instanceNumber][fieldName] = mappingSource;
                            matched = true;
                            break;
                        }
                    } else {
                        // Pattern: prefix_field
                        const regex = new RegExp(`^${group.prefix}_(.+)$`);
                        const match = destColumn.match(regex);

                        if (match) {
                            const fieldName = match[1];

                            if (!groupMappings[group.key]) {
                                groupMappings[group.key] = {};
                            }
                            if (!groupMappings[group.key][1]) {
                                groupMappings[group.key][1] = {};
                            }

                            groupMappings[group.key][1][fieldName] = mappingSource;
                            matched = true;
                            break;
                        }
                    }
                }

                if (!matched) {
                    console.warn('Column does not match any group or base column:', destColumn);
                }
            } catch (error) {
                console.error('Error processing mapping:', mapping, error);
            }
        });

        // Add base mappings only if there are any
        if (Object.keys(baseMappings).length > 0) {
            result.mappings.base = baseMappings;
        }

        // Convert group mappings to array format - only include non-empty instances
        for (const group of COLUMN_GROUPS) {
            const instances = groupMappings[group.key];

            if (instances && Object.keys(instances).length > 0) {
                const instanceArray = [];

                // Sort by instance number and convert to array
                const sortedNumbers = Object.keys(instances)
                    .map(n => parseInt(n))
                    .sort((a, b) => a - b);

                for (const num of sortedNumbers) {
                    const instanceFields = instances[num];

                    // Only add if there are fields with data
                    if (Object.keys(instanceFields).length > 0) {
                        instanceArray.push(instanceFields);
                    }
                }

                // Only add group if it has at least one instance with data
                if (instanceArray.length > 0) {
                    result.mappings[group.key] = instanceArray;
                }
            }
        }

        console.log('Final export mappings for service:', JSON.stringify(result, null, 2));
        return result;
    }, [createMappingSource]);

    const exportMappings = useCallback(async (
        mappings: ColumnMapping[]
    ): Promise<unknown> => {
        setIsExporting(true);
        setExportMessage('');

        await new Promise(resolve => setTimeout(resolve, 1000));

        const serviceData = convertToServiceFormat(mappings);

        if (!serviceData.mappings || Object.keys(serviceData.mappings).length === 0) {
            throw new Error('No valid mappings to export');
        }

        console.log('Sending data to service:', serviceData);

        const isFormatValid = testMappingFormat(serviceData);
        if (!isFormatValid) {
            throw new Error('Invalid mapping format detected. Check console for details.');
        }

        try {
            const result = await saveMappingExport(serviceData);
            setExportMessage('Saved mapping successfully!');

            setTimeout(() => {
                setExportMessage('');
            }, 3000);

            console.log('Saved to Database:', result);
            return result;

        } catch (error) {
            console.error('Export error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setExportMessage(`Error when saving data: ${errorMessage}`);

            setTimeout(() => {
                setExportMessage('');
            }, 5000);
        } finally {
            setIsExporting(false);
        }
    }, [convertToServiceFormat]);

    return {
        isExporting,
        exportMessage,
        exportMappings
    };
};