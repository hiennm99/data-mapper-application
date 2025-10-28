import { MappingSourceComponent } from "@features/exports-manager";
import type { MappingSource } from "@types";
import { capitalizeLabel } from "@utils";
import React, { memo } from "react";


interface ArrayMappingConfig {
    title: string;
    icon: React.ReactNode;
    colorClass: string;
}

interface ArrayMappingItemProps {
    item: {[key: string]: MappingSource};
    itemIndex: number;
    config: ArrayMappingConfig;
}

export const ArrayMappingItem = memo(({
    item,
    itemIndex,
    config
}: ArrayMappingItemProps) => {
    const entries = Object.entries(item);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
            <div className={`${config.colorClass} p-4`}>
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                            {config.icon}
                        </div>
                        <div>
                            <h4 className="text-lg font-bold">
                                {config.title.slice(0, -1)} #{itemIndex + 1}
                            </h4>
                            <p className="text-sm opacity-90">
                                {entries.length} field{entries.length > 1 ? 's' : ''} mapped
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-6 space-y-4">
                {entries.map(([fieldKey, fieldSource]) => {
                    const colorClass = config.colorClass.includes('blue') ? 'bg-blue-100 text-blue-600' :
                        config.colorClass.includes('emerald') ? 'bg-emerald-100 text-emerald-600' :
                            config.colorClass.includes('green') ? 'bg-green-100 text-green-600' :
                                config.colorClass.includes('purple') ? 'bg-purple-100 text-purple-600' :
                                    'bg-orange-100 text-orange-600';

                    return (
                        <MappingSourceComponent
                            key={fieldKey}
                            source={fieldSource}
                            label={capitalizeLabel(fieldKey)}
                            icon={
                                <div className={`w-6 h-6 ${colorClass} rounded-lg flex items-center justify-center mr-2`}>
                                    <span className="text-xs font-bold">
                                        {fieldKey.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            }
                        />
                    );
                })}
            </div>
        </div>
    );
});