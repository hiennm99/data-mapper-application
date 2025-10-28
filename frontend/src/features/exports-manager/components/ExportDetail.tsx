import { ArrayMappings,MappingSourceComponent, StatCard , useMappingStats } from "@features/exports-manager";
import type { MappingExport } from "@types";
import {
    capitalizeLabel,
    generateArrayMappingConfig,
    getArrayMappingKeys,
    normalizeDateInput,
    shortId,
    toStr} from "@utils";
import {
    Calendar,
    Clock,
    Database,
    FileText,
    FolderTree,
    Grid,
    Hash,
    MapPin,
    Table,
    Target,
    X,
} from "lucide-react";
import { useMemo } from "react";

interface BeautifulDetailsModalProps {
    selectedExport: MappingExport | null | undefined;
    showDetails: boolean;
    setShowDetails: (v: boolean) => void;
    formatDate: (d: string) => string;
}

export function ExportDetail({
    selectedExport,
    showDetails,
    setShowDetails,
    formatDate,
}: BeautifulDetailsModalProps) {
    const stats = useMappingStats(selectedExport?.mappings || {});

    const formattedDates = useMemo(() => {
        if (!selectedExport) return { created: '', updated: '' };
        return {
            created: formatDate(normalizeDateInput(selectedExport.created_at)),
            updated: formatDate(normalizeDateInput(selectedExport.updated_at))
        };
    }, [selectedExport, formatDate]);

    if (!showDetails || !selectedExport) return null;

    const handleClose = () => setShowDetails(false);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6">
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="relative flex items-center justify-between text-white">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <Database className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Export Details</h2>
                                <p className="text-blue-100 font-medium">{selectedExport.name}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[70vh] bg-gradient-to-br from-gray-50 to-white">
                    {/* Dates Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-3">
                                <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                                <h3 className="font-semibold text-gray-900">Created Date</h3>
                            </div>
                            <p className="text-gray-600 text-lg font-medium">{formattedDates.created}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-3">
                                <Clock className="w-5 h-5 text-green-600 mr-2" />
                                <h3 className="font-semibold text-gray-900">Last Updated</h3>
                            </div>
                            <p className="text-gray-600 text-lg font-medium">{formattedDates.updated}</p>
                        </div>
                    </div>

                    {/* Statistics Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-8 border border-blue-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Hash className="w-5 h-5 text-blue-600 mr-2" />
                            Overview Statistics
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard
                                icon={<MapPin className="w-6 h-6 text-blue-600" />}
                                value={stats.totalMappings}
                                label="Total Mappings"
                                bgColor="bg-blue-100"
                            />
                            <StatCard
                                icon={<FileText className="w-6 h-6 text-green-600" />}
                                value={stats.uniqueFiles.size}
                                label="Unique Files"
                                bgColor="bg-green-100"
                            />
                            <StatCard
                                icon={<Grid className="w-6 h-6 text-purple-600" />}
                                value={stats.uniqueSheets.size}
                                label="Unique Sheets"
                                bgColor="bg-purple-100"
                            />
                            <StatCard
                                icon={<FolderTree className="w-6 h-6 text-orange-600" />}
                                value={shortId(selectedExport.id)}
                                label="Export ID"
                                bgColor="bg-orange-100"
                            />
                        </div>
                    </div>

                    {/* Source Files & Sheets Section */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                <Table className="w-6 h-6 text-green-600 mr-2" />
                                Source Files & Sheets
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Files */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-3">
                                            <FileText className="w-5 h-5 text-white" />
                                        </div>
                                        <h4 className="font-bold text-white text-lg">Source Files ({stats.uniqueFiles.size})</h4>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="space-y-2">
                                        {Array.from(stats.uniqueFiles).map((file) => (
                                            <div key={file} className="flex items-center p-2 bg-gray-50 rounded-lg">
                                                <FileText className="w-4 h-4 text-blue-600 mr-2" />
                                                <span className="text-sm font-medium text-gray-700 truncate">{file}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Sheets */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-3">
                                            <Grid className="w-5 h-5 text-white" />
                                        </div>
                                        <h4 className="font-bold text-white text-lg">Sheets Used ({stats.uniqueSheets.size})</h4>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex flex-wrap gap-2">
                                        {Array.from(stats.uniqueSheets).map((sheet) => (
                                            <span
                                                key={sheet}
                                                className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full text-xs font-medium hover:from-green-100 hover:to-green-200 hover:text-green-800 transition-colors"
                                            >
                                                {sheet}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Base Fields Section */}
                    {selectedExport.mappings.base && Object.keys(selectedExport.mappings.base).length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                    <Target className="w-6 h-6 text-blue-600 mr-2" />
                                    Base Fields
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {Object.entries(selectedExport.mappings.base).map(([key, value]) => (
                                    <MappingSourceComponent
                                        key={key}
                                        source={value}
                                        label={capitalizeLabel(key)}
                                        icon={
                                            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                                                <span className="text-xs font-bold text-blue-600">
                                                    {key.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Array Mappings Sections */}
                    {getArrayMappingKeys().map((key: string) => {
                        const items = selectedExport.mappings[key];
                        const config = generateArrayMappingConfig(key);
                        return Array.isArray(items) && items.length > 0 && config ? (
                            <ArrayMappings key={key} items={items} config={config} />
                        ) : null;
                    })}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Export ID:{" "}
                            <code className="bg-gray-100 px-2 py-1 rounded font-mono">
                                {toStr(selectedExport.id) || "N/A"}
                            </code>
                        </div>
                        <button
                            onClick={handleClose}
                            className="px-6 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExportDetail;
