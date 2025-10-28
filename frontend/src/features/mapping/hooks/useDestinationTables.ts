// src/hooks/useDestinationTables.ts - Automated version using config
import { BASE_COLUMNS,COLUMN_GROUPS } from '@config';
import type { DestinationTable } from '@types';
import { getGroupByKey } from '@utils';
import { useCallback,useState } from 'react';

import { useDebounce } from '../../../hooks';

export interface TableConfig {
    [key: string]: number; // Dynamic keys for each group
}

export const useDestinationTables = () => {
    // Initialize config dynamically from COLUMN_GROUPS using defaultInstances
    const [config, setConfig] = useState<TableConfig>(() => {
        const initialConfig: TableConfig = {};
        COLUMN_GROUPS.forEach(group => {
            initialConfig[group.key] = group.defaultInstances;
        });
        return initialConfig;
    });

    // Generate columns dynamically from config
    const generateTable = useCallback((config: TableConfig): DestinationTable => {
        const columns = [...BASE_COLUMNS];

        // Generate columns for each group
        COLUMN_GROUPS.forEach(group => {
            const count = config[group.key] || 0;

            if (group.isMultiInstance) {
                // Multi-instance groups like guarantor_1_, guarantor_2_
                for (let i = 1; i <= count; i++) {
                    group.fields.forEach(field => {
                        columns.push(`${group.prefix}_${i}_${field}`);
                    });
                }
            } else {
                // Single instance groups like finance_ongoing_garnishments
                if (count > 0) {
                    group.fields.forEach(field => {
                        columns.push(`${group.prefix}_${field}`);
                    });
                }
            }
        });

        return {
            name: 'essential',
            columns
        };
    }, []);

    const [destinationTables, setDestinationTables] = useState<DestinationTable[]>([
        generateTable(config)
    ]);

    const [globalFilter, setGlobalFilter] = useState<string>('');
    const debouncedFilter = useDebounce(globalFilter, 300);

    const getFilteredColumns = useCallback((table: DestinationTable): string[] => {
        if (!debouncedFilter.trim()) {
            return table.columns;
        }
        return table.columns.filter(column =>
            column.toLowerCase().includes(debouncedFilter.toLowerCase())
        );
    }, [debouncedFilter]);

    // Update config and regenerate table
    const updateConfig = useCallback((newConfig: Partial<TableConfig>) => {
        const updatedConfig = { ...config, ...newConfig };
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        setConfig(updatedConfig);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        setDestinationTables([generateTable(updatedConfig)]);
    }, [config, generateTable]);

    // Generic function to add slot for any group
    const addSlot = useCallback((groupKey: string) => {
        const group = getGroupByKey(groupKey);
        if (!group) return null;

        const currentCount = config[groupKey] || 0;
        if (currentCount < group.maxInstances) {
            const newSlotNumber = currentCount + 1;
            updateConfig({ [groupKey]: newSlotNumber });
            return newSlotNumber;
        }
        return null;
    }, [config, updateConfig]);

    // Generic function to remove slot for any group
    const removeSlot = useCallback((groupKey: string) => {
        const currentCount = config[groupKey] || 0;
        if (currentCount > 0) {
            updateConfig({ [groupKey]: currentCount - 1 });
        }
    }, [config, updateConfig]);

    // Create specific functions for backward compatibility
    const addGuarantorSlot = useCallback(() => addSlot('guarantors'), [addSlot]);
    const removeGuarantorSlot = useCallback(() => removeSlot('guarantors'), [removeSlot]);

    const addJointSlot = useCallback(() => addSlot('joints'), [addSlot]);
    const removeJointSlot = useCallback(() => removeSlot('joints'), [removeSlot]);

    const addAddressSlot = useCallback(() => addSlot('addresses'), [addSlot]);
    const removeAddressSlot = useCallback(() => removeSlot('addresses'), [removeSlot]);

    const addContactSlot = useCallback(() => addSlot('contacts'), [addSlot]);
    const removeContactSlot = useCallback(() => removeSlot('contacts'), [removeSlot]);

    const addBankSlot = useCallback(() => addSlot('banks'), [addSlot]);
    const removeBankSlot = useCallback(() => removeSlot('banks'), [removeSlot]);

    const addAssetSlot = useCallback(() => addSlot('assets'), [addSlot]);
    const removeAssetSlot = useCallback(() => removeSlot('assets'), [removeSlot]);

    const addJobSlot = useCallback(() => addSlot('jobs'), [addSlot]);
    const removeJobSlot = useCallback(() => removeSlot('jobs'), [removeSlot]);

    // New generic functions that can be used for any group
    const addFinanceSlot = useCallback(() => addSlot('finance'), [addSlot]);
    const removeFinanceSlot = useCallback(() => removeSlot('finance'), [removeSlot]);

    return {
        destinationTables,
        globalFilter,
        setGlobalFilter,
        getFilteredColumns,
        config,

        // Backward compatibility functions
        addGuarantorSlot,
        removeGuarantorSlot,
        addJointSlot,
        removeJointSlot,
        addAddressSlot,
        removeAddressSlot,
        addContactSlot,
        removeContactSlot,
        addBankSlot,
        removeBankSlot,
        addAssetSlot,
        removeAssetSlot,
        addJobSlot,
        removeJobSlot,
        // New generic functions
        addSlot,
        removeSlot,
        addFinanceSlot,
        removeFinanceSlot,

        // Utility
        getGroupConfig: (groupKey: string) => config[groupKey] || 0,
        getAllGroups: () => COLUMN_GROUPS
    };
};