// src/services/excelUploadService.ts - Updated to match current backend
import { apiClient, handleApiError, showSuccessToast } from '@lib';
import type {BackendScanResponse, FileData, ScanResult,SheetInfo} from "@types";

// API endpoints
const API_ENDPOINTS = {
    singleUpload: '/api/excel/scan-upload-gcs',
    multipleUpload: '/api/excel/scan-upload-multiple'
};

// Updated interface to match actual backend response
interface ActualMultipleResponse {
    success: boolean;
    total_files: number;
    processed_files: number;
    results: Array<{
        success: boolean;
        message: string;
        scan_result: {
            filename: string;
            file_size: number;
            scan_timestamp: string;
            sheets: Array<{
                sheet_name: string;
                have_header: boolean;
                header_row_idx: number;
                header_at_row: number;
                columns: string[];
                sample_data: string[];
                header_quality?: {
                    total_cols: number;
                    valid_cols: number;
                    unnamed_count: number;
                    unnamed_ratio: number;
                    anchor_matches: number;
                };
                processed_file_info?: null;
            }>;
            total_sheets: number;
            sheets_with_header: number;
            gcs_storage?: null;
        };
        saved_record?: {
            id: string;
            saved_at: string;
        };
        processing_info?: {
            file_size: string;
            max_scan_rows: number;
            saved_to_db: boolean;
        };
        gcs_info?: {
            file_uploaded: boolean;
            scan_result_uploaded: boolean;
            file_gcs_info?: null;
            scan_result_gcs_info?: null;
        };
    }>;
}

// Single file upload and scan
export const uploadAndScanExcelFile = async (
    file: File,
    maxScanRows: number = 10,
    saveToDb: boolean = true
): Promise<FileData> => {
    // Validate file
    if (!file) {
        throw new Error('No file provided');
    }

    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
        throw new Error('Only Excel files (.xlsx, .xls) are supported');
    }

    // Check file size (100MB limit)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 100) {
        throw new Error(`File too large: ${fileSizeMB.toFixed(2)}MB. Maximum allowed: 100MB`);
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('max_scan_rows', maxScanRows.toString());
    formData.append('save_to_db', saveToDb.toString());

    console.log(`Uploading file: ${file.name} (${fileSizeMB.toFixed(2)}MB)`);

    let result: BackendScanResponse;

    try {
        // Make API call
        const response = await apiClient.post<BackendScanResponse>(API_ENDPOINTS.multipleUpload, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        result = response.data;
        console.log('Upload successful:', result);

    } catch (error) {
        console.error('Excel upload error:', error);
        handleApiError(error, 'Failed to upload Excel file');
        throw error;
    }

    // Validate response outside try block
    if (!result.success) {
        const errorMsg = result.message || 'Scan failed';
        console.error('Upload failed:', errorMsg);
        throw new Error(errorMsg);
    }

    // Transform to frontend format
    const fileData: FileData = {
        file: file.name,
        sheets: result.scan_result.sheets.map(sheet => ({
            sheet_name: sheet.sheet_name,
            have_header: sheet.have_header,
            columns: sheet.columns || [],
            sample_data: sheet.sample_data || []
        }))
    };

    showSuccessToast(`Successfully scanned ${file.name} - Found ${result.scan_result.total_sheets} sheets`);

    return fileData;
};

// Multiple files upload and scan - UPDATED TO MATCH BACKEND
export const uploadAndScanMultipleExcelFiles = async (
    files: File[],
    maxScanRows: number = 10,
    saveToDb: boolean = true
): Promise<FileData[]> => {
    // Validate files array
    if (!files || files.length === 0) {
        throw new Error('No files provided');
    }

    if (files.length > 5) {
        throw new Error(`Too many files: ${files.length}. Maximum allowed: 5 files`);
    }

    // Validate each file
    let totalSize = 0;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
            throw new Error(`File ${i + 1} (${file.name}): Only Excel files (.xlsx, .xls) are supported`);
        }

        const fileSizeMB = file.size / (1024 * 1024);
        totalSize += fileSizeMB;

        if (fileSizeMB > 100) {
            throw new Error(`File ${i + 1} too large: ${fileSizeMB.toFixed(2)}MB. Maximum allowed: 100MB`);
        }
    }

    if (totalSize > 200) {
        throw new Error(`Total upload size too large: ${totalSize.toFixed(2)}MB. Maximum allowed: 200MB`);
    }

    // Prepare form data
    const formData = new FormData();
    files.forEach(file => {
        formData.append('files', file);
    });
    formData.append('max_scan_rows', maxScanRows.toString());
    formData.append('save_to_db', saveToDb.toString());

    console.log(`Uploading ${files.length} files, total size: ${totalSize.toFixed(2)}MB`);

    let result: ActualMultipleResponse;

    try {
        // Make API call
        const response = await apiClient.post<ActualMultipleResponse>(API_ENDPOINTS.multipleUpload, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        result = response.data;
        console.log('Batch upload successful:', result);

    } catch (error) {
        console.error('Multiple Excel upload error:', error);
        handleApiError(error, 'Failed to upload Excel files');
        throw error;
    }

    // Validate response outside try block
    if (!result.success) {
        console.error('Batch scan failed');
        throw new Error('Batch scan failed');
    }

    if (!result.results || !Array.isArray(result.results)) {
        console.error('Backend response missing results array');
        throw new Error('Backend response missing results array. Response: ' + JSON.stringify(result));
    }

    // Transform successful results to frontend format - MATCH ACTUAL BACKEND STRUCTURE
    const successfulResults: FileData[] = [];
    const errors: string[] = [];

    result.results.forEach(fileResult => {
        if (fileResult.success && fileResult.scan_result) {
            // Extract data from scan_result
            const scanResult = fileResult.scan_result;

            successfulResults.push({
                file: scanResult.filename,
                sheets: scanResult.sheets.map(sheet => ({
                    sheet_name: sheet.sheet_name,
                    have_header: sheet.have_header,
                    columns: sheet.columns || [],
                    sample_data: sheet.sample_data || []
                }))
            });
        } else if (!fileResult.success) {
            errors.push(`${fileResult.message || 'Unknown error'}`);
        }
    });

    // Show results
    if (successfulResults.length > 0) {
        const totalSheets = successfulResults.reduce((sum, file) => sum + file.sheets.length, 0);
        showSuccessToast(
            `Successfully processed ${successfulResults.length}/${files.length} files. ` +
            `Found ${totalSheets} total sheets.`
        );
    }

    if (errors.length > 0) {
        console.warn('Some files failed to process:', errors);
        showSuccessToast(`${errors.length} file(s) failed to process. Check console for details.`);
    }

    if (successfulResults.length === 0) {
        throw new Error('No files were successfully processed');
    }

    return successfulResults;
};

// Utility function to validate Excel file
export const validateExcelFile = (file: File): { valid: boolean; error?: string } => {
    if (!file) {
        return { valid: false, error: 'No file provided' };
    }

    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
        return { valid: false, error: 'Only Excel files (.xlsx, .xls) are supported' };
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 100) {
        return { valid: false, error: `File too large: ${fileSizeMB.toFixed(2)}MB. Maximum allowed: 100MB` };
    }

    return { valid: true };
};

// Utility function to validate multiple Excel files
export const validateExcelFiles = (files: File[]): { valid: boolean; error?: string } => {
    if (!files || files.length === 0) {
        return { valid: false, error: 'No files provided' };
    }

    if (files.length > 5) {
        return { valid: false, error: `Too many files: ${files.length}. Maximum allowed: 5 files` };
    }

    let totalSize = 0;
    for (let i = 0; i < files.length; i++) {
        const fileValidation = validateExcelFile(files[i]);
        if (!fileValidation.valid) {
            return { valid: false, error: `File ${i + 1}: ${fileValidation.error}` };
        }

        totalSize += files[i].size / (1024 * 1024);
    }

    if (totalSize > 200) {
        return { valid: false, error: `Total size too large: ${totalSize.toFixed(2)}MB. Maximum allowed: 200MB` };
    }

    return { valid: true };
};

// Export types for use in other files
export type {
    BackendScanResponse,
    FileData,
    ScanResult,
    SheetInfo};