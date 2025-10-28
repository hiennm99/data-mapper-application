// File: features/exports-manager/services/exportManagerService.ts
import { COLUMN_GROUPS } from '@config';
import { apiClient, handleApiError, showSuccessToast } from '@lib';
import type {MappingExportData,MappingExportResponse, MappingSource} from "@types";

// API endpoints
const API_ENDPOINTS = {
    mappings: '/api/mapping-exports',
    health: '/',
    stats: '/api/mapping-exports/stats',
    search: '/api/mapping-exports/search',
    batch: '/api/mapping-exports/batch'
};

// Get all group keys for validation
const GROUP_KEYS = COLUMN_GROUPS.map(g => g.key);

// Validate MappingSource - Return null if any field is missing (backend requirement)
const validateMappingSource = (source: unknown): MappingSource | null => {
    if (!source || typeof source !== 'object') {
        return null;
    }

    const sourceObj = source as Record<string, unknown>;
    const file = typeof sourceObj.file === 'string' ? sourceObj.file.trim() : '';
    const sheet = typeof sourceObj.sheet === 'string' ? sourceObj.sheet.trim() : '';
    const column = typeof sourceObj.column === 'string' ? sourceObj.column.trim() : '';

    // Backend requires ALL 3 fields to be non-empty
    if (!file || !sheet || !column) {
        return null;
    }

    return { file, sheet, column };
};

// Validate object mappings (for base group) - Filter out incomplete mappings
const validateObjectMappings = (data: unknown): {[key: string]: MappingSource} => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return {};
    }

    const validMappings: {[key: string]: MappingSource} = {};

    for (const [key, value] of Object.entries(data)) {
        const validSource = validateMappingSource(value);
        if (validSource) {
            validMappings[key] = validSource;
        }
    }

    return validMappings;
};

// Validate array mappings (for group arrays) - Filter out incomplete mappings
const validateArrayMappings = (data: unknown): Array<{[key: string]: MappingSource}> => {
    if (!data || !Array.isArray(data)) {
        return [];
    }

    const validMappings: Array<{[key: string]: MappingSource}> = [];

    data.forEach((item) => {
        if (!item || typeof item !== 'object') {
            return;
        }

        const validItem: {[key: string]: MappingSource} = {};

        for (const [key, value] of Object.entries(item)) {
            const validSource = validateMappingSource(value);
            if (validSource) {
                validItem[key] = validSource;
            }
        }

        // Only add instance if it has at least one complete mapping
        if (Object.keys(validItem).length > 0) {
            validMappings.push(validItem);
        }
    });

    return validMappings;
};

// Helper function to validate and filter mappings by group type
const validateAndFilterMappings = (
    mappings: {[key: string]: {[key: string]: MappingSource} | Array<{[key: string]: MappingSource}>}
): {[key: string]: {[key: string]: MappingSource} | Array<{[key: string]: MappingSource}>} => {
    const validatedMappings: {[key: string]: {[key: string]: MappingSource} | Array<{[key: string]: MappingSource}>} = {};

    for (const [key, value] of Object.entries(mappings)) {
        if (key === 'base') {
            const validatedBase = validateObjectMappings(value);
            if (Object.keys(validatedBase).length > 0) {
                validatedMappings[key] = validatedBase;
            }
        } else if (GROUP_KEYS.includes(key)) {
            const validatedArray = validateArrayMappings(value);
            if (validatedArray.length > 0) {
                validatedMappings[key] = validatedArray;
            }
        }
    }

    return validatedMappings;
};

// Validate mapping data - Clean up before sending to backend
const validateMappingData = (data: MappingExportData): MappingExportData => {
    if (!data) {
        throw new Error('Data is required');
    }

    if (!data.name || !data.name.trim()) {
        throw new Error('Name is required and must be a non-empty string');
    }

    if (!data.mappings || typeof data.mappings !== 'object') {
        throw new Error('Mappings are required and must be an object');
    }

    const validatedMappings = validateAndFilterMappings(data.mappings);

    if (Object.keys(validatedMappings).length === 0) {
        throw new Error('No valid mappings found - all mappings are incomplete (missing file, sheet, or column)');
    }

    return {
        name: data.name.trim(),
        mappings: validatedMappings
    };
};

// Save mapping export
export const saveMappingExport = async (data: MappingExportData): Promise<MappingExportResponse> => {
    console.log('=== RAW INPUT DATA ===');
    console.log(JSON.stringify(data, null, 2));

    const validatedData = validateMappingData(data);

    try {

        console.log('=== CLEANED DATA (sending to backend) ===');
        console.log(JSON.stringify(validatedData, null, 2));

        const response = await apiClient.post<MappingExportResponse>(API_ENDPOINTS.mappings, validatedData);

        console.log('Response status:', response.status);
        console.log('✅ Success:', response.data);
        showSuccessToast('Saved mapping successfully!');
        return response.data;
    } catch (error) {
        console.error('Save mapping export error:', error);
        handleApiError(error, 'An error occurred while saving mapping');
        throw error;
    }
};

// Get mapping exports
export const getMappingExports = async (skip: number = 0, limit: number = 100): Promise<MappingExportResponse[]> => {
    try {
        const response = await apiClient.get<MappingExportResponse[]>(API_ENDPOINTS.mappings, {
            params: { skip, limit }
        });
        return response.data;
    } catch (error) {
        console.error('Get mapping exports error:', error);
        handleApiError(error, 'An error occurred while fetching mappings');
        throw error;
    }
};

// Delete mapping export
export const deleteMappingExport = async (id: string): Promise<void> => {
    if (!id || !id.trim()) {
        throw new Error('Record ID is required');
    }

    try {
        await apiClient.delete(`${API_ENDPOINTS.mappings}/${id}`);
        showSuccessToast('Deleted mapping successfully!');
    } catch (error) {
        console.error('Delete mapping export error:', error);
        handleApiError(error, 'An error occurred while deleting mapping');
        throw error;
    }
};

// Batch delete mapping exports
export const deleteMappingExports = async (ids: string[]): Promise<void> => {
    if (!ids || ids.length === 0) {
        throw new Error('At least one record ID is required');
    }

    try {
        const result = await apiClient.delete<{success: boolean; deleted_count: number; error_count: number}>(API_ENDPOINTS.batch, {
            data: ids
        });

        if (result.data.success) {
            showSuccessToast(`Deleted ${result.data.deleted_count} mappings successfully!`);
        } else {
            showSuccessToast(`Deleted ${result.data.deleted_count} mappings, ${result.data.error_count} errors occurred.`);
        }
    } catch (error) {
        console.error('Batch delete mapping exports error:', error);
        handleApiError(error, 'An error occurred while deleting mappings');
        throw error;
    }
};

// Get mapping export by ID
export const getMappingExportById = async (id: string): Promise<MappingExportResponse> => {
    if (!id || !id.trim()) {
        throw new Error('Record ID is required');
    }

    try {
        const response = await apiClient.get<MappingExportResponse>(`${API_ENDPOINTS.mappings}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Get mapping export by ID error:', error);
        handleApiError(error, 'An error occurred while fetching mapping');
        throw error;
    }
};

// Update mapping export
export const updateMappingExport = async (
    id: string,
    data: {
        name?: string;
        mappings?: {[key: string]: {[key: string]: MappingSource} | Array<{[key: string]: MappingSource}>};
    }
): Promise<MappingExportResponse> => {
    if (!id || !id.trim()) {
        throw new Error('Record ID is required');
    }

    const payload: { [key: string]: unknown } = {};

    if (data.name && data.name.trim()) {
        payload.name = data.name.trim();
    }

    if (data.mappings !== undefined) {
        const validatedMappings = validateAndFilterMappings(data.mappings);

        if (Object.keys(validatedMappings).length > 0) {
            payload.mappings = validatedMappings;
        } else {
            throw new Error('No valid mappings found for update');
        }
    }

    if (Object.keys(payload).length === 0) {
        throw new Error('No valid data to update');
    }

    try {
        const response = await apiClient.put<MappingExportResponse>(`${API_ENDPOINTS.mappings}/${id}`, payload);
        showSuccessToast('Updated mapping successfully!');
        return response.data;
    } catch (error) {
        console.error('Update mapping export error:', error);
        handleApiError(error, 'An error occurred while updating mapping');
        throw error;
    }
};

// Search mapping exports
export const searchMappingExports = async (
    query: string,
    signal?: AbortSignal,
    skip: number = 0,
    limit: number = 100
): Promise<MappingExportResponse[]> => {
    try {
        const response = await apiClient.get<MappingExportResponse[]>(API_ENDPOINTS.search, {
            params: { query, skip, limit },
            signal: signal
        });
        return response.data;
    } catch (error) {
        console.error('Search mapping exports error:', error);
        handleApiError(error, 'An error occurred while searching mappings');
        throw error;
    }
};

// Get mapping statistics
export const getMappingStats = async (): Promise<{
    total_mappings: number;
    timestamp: string;
}> => {
    try {
        const response = await apiClient.get<{
            total_mappings: number;
            timestamp: string;
        }>(API_ENDPOINTS.stats);
        return response.data;
    } catch (error) {
        console.error('Get mapping stats failed:', error);
        return {
            total_mappings: 0,
            timestamp: new Date().toISOString()
        };
    }
};

// Validate backend connection
export const testBackendConnection = async (): Promise<boolean> => {
    try {
        const response = await apiClient.get<{message: string; timestamp: string}>(API_ENDPOINTS.health);
        const data = response.data;
        return !!(data.message && data.message.includes('running'));
    } catch (error) {
        console.error('Backend connection test failed:', error);
        return false;
    }
};

// Health check utility
export const checkBackendHealth = async (): Promise<{
    status: 'healthy' | 'unhealthy';
    message?: string;
    timestamp: string;
}> => {
    try {
        const response = await apiClient.get<{message: string; timestamp: string}>(API_ENDPOINTS.health);
        const data = response.data;
        return {
            status: 'healthy',
            message: data.message,
            timestamp: data.timestamp
        };
    } catch (error) {
        console.error('Backend health check failed:', error);
        return {
            status: 'unhealthy',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
};

// Utility function to format dates
export const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (error) {
        console.error('Date formatting error:', error);
        return dateString;
    }
};

export type { MappingExportData, MappingExportResponse,MappingSource };

export default {
    saveMappingExport,
    getMappingExports,
    deleteMappingExport,
    deleteMappingExports,
    getMappingExportById,
    updateMappingExport,
    searchMappingExports,
    getMappingStats,
    testBackendConnection,
    checkBackendHealth,
    formatDate
};