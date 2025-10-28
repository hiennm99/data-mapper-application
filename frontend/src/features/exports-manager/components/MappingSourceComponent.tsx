import { SourceField } from "@features/exports-manager";
import type { MappingSource } from "@types";
import { FileText, Grid, Layers } from "lucide-react";
import React, { memo } from "react";

interface MappingSourceComponentProps {
    source: MappingSource;
    label: string;
    icon: React.ReactNode;
}

export const MappingSourceComponent = memo(({
    source,
    label,
    icon
}: MappingSourceComponentProps) => (
    <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-3">
            <h5 className="font-medium text-gray-900 flex items-center">
                {icon}
                {label}
            </h5>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SourceField
                icon={<FileText className="w-4 h-4 text-blue-600 mr-1" />}
                label="File"
                value={source.file}
                colorBorder="border-blue-200"
                colorText="text-blue-800"
            />
            <SourceField
                icon={<Grid className="w-4 h-4 text-indigo-600 mr-1" />}
                label="Sheet"
                value={source.sheet}
                colorBorder="border-indigo-200"
                colorText="text-indigo-800"
            />
            <SourceField
                icon={<Layers className="w-4 h-4 text-purple-600 mr-1" />}
                label="Column"
                value={source.column}
                colorBorder="border-purple-200"
                colorText="text-purple-800"
            />
        </div>
    </div>
));

MappingSourceComponent.displayName = 'MappingSourceComponent';
