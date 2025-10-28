import { ArrayMappingItem } from "@features/exports-manager";
import type { MappingSource } from "@types";
import React, { memo } from "react";

interface ArrayMappingConfig {
    title: string;
    icon: React.ReactNode;
    colorClass: string;
}

interface ArrayMappingsProps {
    items: Array<{[key: string]: MappingSource}>;
    config: ArrayMappingConfig;
}

export const ArrayMappings = memo(({
    items,
    config
}: ArrayMappingsProps) => {
    if (!items?.length) return null;

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <span className="mr-2">{config.icon}</span>
                    {config.title}
                    <span className={`ml-2 px-3 py-1 ${config.colorClass} text-white rounded-full text-sm font-medium`}>
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                </h3>
            </div>
            <div className="space-y-6">
                {items.map((item, idx) => (
                    <ArrayMappingItem key={idx} item={item} itemIndex={idx} config={config} />
                ))}
            </div>
        </div>
    );
});

ArrayMappings.displayName = 'ArrayMappings';
