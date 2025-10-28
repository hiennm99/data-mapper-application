import type { MappingExport, MappingSource } from "@types";
import { getArrayMappingKeys } from "@utils";
import { useMemo } from "react";

/**
 * Custom Hook to calculate mapping statistics
 */
export const useMappingStats = (mappings: MappingExport['mappings']) => {
    return useMemo(() => {
        let count = 0;
        const files = new Set<string>();
        const sheets = new Set<string>();

        const processSources = (sources: Record<string, MappingSource> | MappingSource | Array<Record<string, MappingSource>>) => {
            if (!sources) return;

            if (Array.isArray(sources)) {
                sources.forEach(item => processSources(item));
            }
            else if (typeof sources === 'object' && !Array.isArray(sources)) {
                Object.values(sources).forEach((source: MappingSource) => {
                    if (source?.file) files.add(source.file);
                    if (source?.sheet) sheets.add(source.sheet);
                });
            }
        };

        if (mappings.base) {
            count += Object.keys(mappings.base).length;
            processSources(mappings.base);
        }

        getArrayMappingKeys().forEach((key: string) => {
            const value = mappings[key];
            if (Array.isArray(value)) {
                value.forEach(item => {
                    count += Object.keys(item).length;
                    processSources(item);
                });
            }
        });

        return { totalMappings: count, uniqueFiles: files, uniqueSheets: sheets };
    }, [mappings]);
};
