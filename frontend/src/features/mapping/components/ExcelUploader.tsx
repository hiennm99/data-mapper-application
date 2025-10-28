import {
    uploadAndScanMultipleExcelFiles,
    validateExcelFiles,
} from '@features/mapping';
import type { ExcelUploadProps, UploadedFile } from "@types";
import { AlertCircle, CheckCircle, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import React, { useCallback,useState } from 'react';


const ExcelUploader: React.FC<ExcelUploadProps> = ({
                                                     onSchemaLoaded,
                                                     isLoading,
                                                     setIsLoading
                                                 }) => {

    const MAX_SCAN_ROWS = 10;
    const SAVE_SCHEMA = true;
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [dragOver, setDragOver] = useState(false);

    const handleFileSelect = useCallback(async (files: FileList) => {
        const fileArray = Array.from(files).filter(file =>
            file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')
        );

        if (fileArray.length === 0) {
            alert('Please select only Excel files (.xlsx or .xls)');
            return;
        }

        // Validate files using the service
        const validation = validateExcelFiles(fileArray);
        if (!validation.valid) {
            alert(validation.error);
            return;
        }

        setIsLoading(true);

        // Initialize upload tracking
        const newUploadedFiles: UploadedFile[] = fileArray.map(file => ({
            file,
            progress: 0,
            status: 'uploading' as const
        }));

        setUploadedFiles(newUploadedFiles);

        try {
            // Update progress to show upload started
            setUploadedFiles(prev => prev.map(uf => ({ ...uf, progress: 25 })));

            // Use the service to upload and scan files
            const results = await uploadAndScanMultipleExcelFiles(
                fileArray,
                MAX_SCAN_ROWS, // max_scan_rows
                SAVE_SCHEMA // save_to_db
            );

            // Update progress to show processing
            setUploadedFiles(prev => prev.map(uf => ({ ...uf, progress: 75 })));

            // Update success status for successful uploads
            const successfulFileNames = results.map(r => r.file);
            setUploadedFiles(prev => prev.map(uf => {
                const isSuccessful = successfulFileNames.includes(uf.file.name);
                const schema = results.find(r => r.file === uf.file.name);

                return {
                    ...uf,
                    progress: 100,
                    status: isSuccessful ? 'success' : 'error',
                    schema: schema,
                    error: !isSuccessful ? 'Upload failed' : undefined
                };
            }));

            // Load all successful schemas
            if (results.length > 0) {
                onSchemaLoaded(results);
            }

        } catch (error) {
            console.error('Upload error:', error);

            // Mark all files as failed
            setUploadedFiles(prev => prev.map(uf => ({
                ...uf,
                progress: 0,
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload failed'
            })));
        } finally {
            setIsLoading(false);
        }
    }, [SAVE_SCHEMA, onSchemaLoaded, setIsLoading]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            await handleFileSelect(files);
        }
    }, [handleFileSelect]);

    const removeFile = useCallback((index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    return (
        <div className="w-full max-w-4xl mx-auto p-6">
            {/* Upload Area */}
            <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragOver
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="flex items-center space-x-2">
                        <Upload className="w-12 h-12 text-gray-400" />
                        <FileSpreadsheet className="w-12 h-12 text-green-500" />
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Upload Excel Files for Schema Analysis
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Drop your Excel files here or click to browse. We'll analyze the structure and create a mapping schema.
                        </p>

                        <input
                            type="file"
                            multiple
                            accept=".xlsx,.xls"
                            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                            className="hidden"
                            id="file-upload"
                            disabled={isLoading}
                        />

                        <label
                            htmlFor="file-upload"
                            className={`inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white transition-colors cursor-pointer ${
                                isLoading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                                <Upload className="w-5 h-5 mr-2" />
                            )}
                            {isLoading ? 'Processing...' : 'Select Excel Files'}
                        </label>
                    </div>

                    <div className="text-sm text-gray-500">
                        Supported formats: .xlsx, .xls (Max 5 files, 50MB each, 200MB total)
                    </div>
                </div>
            </div>

            {/* Upload Progress */}
            {uploadedFiles.length > 0 && (
                <div className="mt-6 space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Upload Progress</h4>

                    {uploadedFiles.map((uploadedFile, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-3">
                                    <FileSpreadsheet className="w-5 h-5 text-green-500" />
                                    <span className="font-medium text-gray-900">
                                        {uploadedFile.file.name}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        ({(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB)
                                    </span>
                                </div>

                                <div className="flex items-center space-x-2">
                                    {uploadedFile.status === 'uploading' && (
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                    )}
                                    {uploadedFile.status === 'success' && (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    )}
                                    {uploadedFile.status === 'error' && (
                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                    )}

                                    <button
                                        onClick={() => removeFile(index)}
                                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {uploadedFile.status === 'uploading' && (
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadedFile.progress}%` }}
                                    ></div>
                                </div>
                            )}

                            {/* Status Messages */}
                            {uploadedFile.status === 'success' && uploadedFile.schema && (
                                <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                                    ✓ Successfully analyzed {uploadedFile.schema.sheets?.length || 0} sheets
                                </div>
                            )}

                            {uploadedFile.status === 'error' && (
                                <div className="text-sm text-red-700 bg-red-50 p-2 rounded">
                                    ✗ Error: {uploadedFile.error}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Instructions */}
            {uploadedFiles.length === 0 && !isLoading && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <FileSpreadsheet className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Upload your Excel files (.xlsx or .xls format)</li>
                                <li>• We'll automatically scan and analyze the structure</li>
                                <li>• Column headers and sample data will be detected</li>
                                <li>• Use the generated schema to create your mappings</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExcelUploader;