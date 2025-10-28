// components/DestinationPanel.tsx - Automated version with CreatedDateInput
import { useDestinationTables } from '@features/mapping';
import type { ColumnMapping,DestinationTable } from '@types';
import { formatColumnName, getColorClasses,getGroupByKey, getGroupIcon, parseColumnName } from "@utils";
import _ from 'lodash';
import { Columns, Search, Trash2, Users,X } from 'lucide-react';
import React, { useEffect,useState } from 'react';

interface ColumnGroup {
    name: string;
    prefix: string;
    columns: string[];
    icon: React.ReactNode;
    color: string;
    instanceNumber?: number;
}

interface TabGroup {
    key: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    groups: ColumnGroup[];
}

interface DestinationTablesPanelProps {
    destinationTables: DestinationTable[],
    mappings: ColumnMapping[],
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void,
    onDrop: (e: React.DragEvent<HTMLDivElement>, destinationTable: DestinationTable, destinationColumn: string) => void,
    onRemoveMapping: (mappingId: string) => void,
    globalFilter: string,
    onGlobalFilterChange: (value: string) => void,
    getFilteredColumns?: (table: DestinationTable) => string[],
    onCreatedDateChange?: (date: string | null) => void, // New prop for handling created date
    sourceColumns?: string[] // New prop to check if created_date exists in source data
}

export const DestinationPanel: React.FC<DestinationTablesPanelProps> = ({
                                                                                  mappings,
                                                                                  onDragOver,
                                                                                  onDrop,
                                                                                  onRemoveMapping,
                                                                                  globalFilter,
                                                                                  onGlobalFilterChange,
                                                                                  getFilteredColumns,
                                                                                  sourceColumns = []
                                                                              }) => {
    const {
        destinationTables,
        config,
        addSlot, // Use generic function
        getAllGroups
    } = useDestinationTables();

    const [activeMainTab, setActiveMainTab] = useState<string>('essential');
    const [activeSubTab, setActiveSubTab] = useState<{ [key: string]: string }>({});
    const [isUserManuallySelectedTab, setIsUserManuallySelectedTab] = useState<boolean>(false);

    // Check if created_date exists in source data
    useEffect(() => {
        const hasCreatedDate = sourceColumns.some(col =>
            col.toLowerCase().includes('created_date') ||
            col.toLowerCase().includes('create_date') ||
            col.toLowerCase().includes('date_created')
        );

        // Auto-show the input if no created_date found in source
        if (!hasCreatedDate) {
            // Don't auto-show, let user decide
            // setShowCreatedDateInput(true);
        }
    }, [sourceColumns]);

    const setActiveSubTabForMain = (mainTab: string, subTab: string) => {
        setActiveSubTab(prev => ({
            ...prev,
            [mainTab]: subTab
        }));
    };

    const groupColumns = (columns: string[]): TabGroup[] => {
        const groups: { [key: string]: ColumnGroup } = {};
        const mainColumns: string[] = [];

        columns.forEach(column => {
            const parsed = parseColumnName(column);

            if (parsed) {
                const groupDef = getGroupByKey(parsed.groupKey!);
                if (!groupDef) return;

                let groupKey: string;
                if (groupDef.isMultiInstance && parsed.instanceNumber) {
                    groupKey = `${parsed.prefix}_${parsed.instanceNumber}`;
                } else {
                    groupKey = parsed.prefix!;
                }

                if (!groups[groupKey]) {
                    groups[groupKey] = {
                        name: groupDef.isMultiInstance && parsed.instanceNumber
                            ? `${groupDef.name} ${parsed.instanceNumber}`
                            : groupDef.name,
                        prefix: groupKey,
                        columns: [],
                        icon: getGroupIcon(groupDef.iconName, "w-4 h-4"), // Updated to use getGroupIcon
                        color: groupDef.color,
                        instanceNumber: parsed.instanceNumber
                    };
                }
                groups[groupKey].columns.push(column);
            } else {
                mainColumns.push(column);
            }
        });

        // Group by categories dynamically
        const tabGroups: TabGroup[] = [
            {
                key: 'essential', // Changed from 'general' to 'essential'
                name: 'Essential', // Changed from 'General' to 'Essential'
                icon: <Users className="w-5 h-5"/>,
                color: 'blue',
                groups: [{
                    name: 'Essential', // Changed from 'Main Borrower' to 'Essential'
                    prefix: 'main',
                    columns: mainColumns,
                    icon: <Users className="w-4 h-4"/>,
                    color: 'blue'
                }]
            }
        ];

        // Dynamically create tabs for each group type
        getAllGroups().forEach(groupDef => {
            const groupInstances = Object.values(groups).filter(g =>
                g.prefix.startsWith(groupDef.prefix + (groupDef.isMultiInstance ? '_' : ''))
            ).sort((a, b) => (a.instanceNumber || 0) - (b.instanceNumber || 0));

            if (groupInstances.length > 0) {
                // Skip creating separate tabs for single-instance groups that should be in essential
                // Only create tabs for multi-instance groups or explicitly configured single groups
                if (groupDef.isMultiInstance || groupDef.key === 'finance') {
                    tabGroups.push({
                        key: groupDef.key,
                        name: _.startCase(groupDef.key),
                        icon: getGroupIcon(groupDef.iconName, "w-5 h-5"),
                        color: groupDef.color,
                        groups: groupInstances
                    });
                }
            }
        });

        return tabGroups;
    };

    const table = destinationTables[0];
    const filteredColumns = getFilteredColumns!(table);
    const tabGroups = groupColumns(filteredColumns);

    // Auto-switch tab logic (unchanged)
    React.useEffect(() => {
        if (globalFilter.trim() && !isUserManuallySelectedTab) {
            let bestTab = activeMainTab;
            let maxMatches = 0;

            tabGroups.forEach(tabGroup => {
                const tabMatches = tabGroup.groups.reduce((count, group) => {
                    return count + group.columns.filter(col => filteredColumns.includes(col)).length;
                }, 0);

                if (tabMatches > maxMatches) {
                    maxMatches = tabMatches;
                    bestTab = tabGroup.key;
                }
            });

            if (bestTab !== activeMainTab && maxMatches > 0) {
                setActiveMainTab(bestTab);
                const targetTabGroup = tabGroups.find(tg => tg.key === bestTab);
                if (targetTabGroup && targetTabGroup.groups.length > 0 && bestTab !== 'essential') {
                    setActiveSubTabForMain(bestTab, targetTabGroup.groups[0].prefix);
                }
            }
        }

        if (!globalFilter.trim()) {
            setIsUserManuallySelectedTab(false);
        }
    }, [globalFilter, filteredColumns, isUserManuallySelectedTab, activeMainTab, tabGroups]);

    const handleTabClick = (tabKey: string) => {
        setActiveMainTab(tabKey);
        setIsUserManuallySelectedTab(true);
        const targetTabGroup = tabGroups.find(tg => tg.key === tabKey);
        if (targetTabGroup && targetTabGroup.groups.length > 0 && tabKey !== 'essential') {
            const currentSubTab = activeSubTab[tabKey];
            if (!currentSubTab) {
                setActiveSubTabForMain(tabKey, targetTabGroup.groups[0].prefix);
            }
        }
    };

    const activeTabGroup = tabGroups.find(tg => tg.key === activeMainTab);

    let activeGroup: ColumnGroup | undefined;
    let columnsToShow: string[] = [];

    if (globalFilter.trim()) {
        if (activeTabGroup) {
            if (activeMainTab === 'essential') {
                const mainGroup = activeTabGroup.groups.find(g => g.prefix === 'main');
                if (mainGroup) {
                    columnsToShow = mainGroup.columns.filter(col => filteredColumns.includes(col));
                    activeGroup = {
                        name: `Essential Results`, // Updated name
                        prefix: 'essential_results', // Updated prefix
                        columns: columnsToShow,
                        icon: mainGroup.icon,
                        color: mainGroup.color
                    };
                }
            } else {
                const currentSubTab = activeSubTab[activeMainTab];
                let targetGroup = activeTabGroup.groups.find(g => g.prefix === currentSubTab);

                if (!targetGroup && activeTabGroup.groups.length > 0) {
                    targetGroup = activeTabGroup.groups[0];
                    setActiveSubTabForMain(activeMainTab, targetGroup.prefix);
                }

                if (targetGroup) {
                    columnsToShow = targetGroup.columns.filter(col => filteredColumns.includes(col));
                    activeGroup = {
                        name: `${targetGroup.name} Results`,
                        prefix: `${targetGroup.prefix}_results`,
                        columns: columnsToShow,
                        icon: targetGroup.icon,
                        color: targetGroup.color
                    };
                }
            }
        }
    } else {
        activeGroup = activeTabGroup?.groups.find(g => {
            if (activeMainTab === 'essential') return g.prefix === 'main';
            return g.prefix === activeSubTab[activeMainTab];
        }) || activeTabGroup?.groups[0];

        columnsToShow = activeGroup?.columns || [];
    }

    return (
        <div className="w-full flex flex-col h-screen bg-gray-100">
            {/* Search Bar */}
            <div className="bg-white p-4 border-b border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                    <input
                        type="text"
                        placeholder="Search all columns across all groups..."
                        value={globalFilter}
                        onChange={(e) => onGlobalFilterChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    />
                    {globalFilter && (
                        <button
                            onClick={() => onGlobalFilterChange('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                            <X className="h-4 w-4 text-gray-400 hover:text-gray-600"/>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Tabs Navigation */}
            <div className="bg-white border-b border-gray-200">
                <div className="flex">
                    {tabGroups.map((tabGroup) => {
                        const matchingCount = globalFilter.trim() ?
                            tabGroup.groups.reduce((count, group) => {
                                return count + group.columns.filter(col => filteredColumns.includes(col)).length;
                            }, 0) : 0;

                        return (
                            <button
                                key={tabGroup.key}
                                onClick={() => handleTabClick(tabGroup.key)}
                                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 relative ${
                                    activeMainTab === tabGroup.key
                                        ? `${getColorClasses(tabGroup.color, 'border')} ${getColorClasses(tabGroup.color, 'text')} ${getColorClasses(tabGroup.color, 'bg')}`
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className={`mr-3 ${
                                    activeMainTab === tabGroup.key
                                        ? getColorClasses(tabGroup.color, 'text')
                                        : 'text-gray-400'
                                }`}>
                                    {tabGroup.icon}
                                </div>
                                <span className="whitespace-nowrap">{tabGroup.name}</span>
                                {tabGroup.groups.length > 1 && (
                                    <span className="ml-2 px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded-full">
                                        {tabGroup.groups.length}
                                    </span>
                                )}

                                {globalFilter.trim() && matchingCount > 0 && (
                                    <span className={`ml-2 px-2 py-1 text-xs rounded-full font-medium bg-${tabGroup.color}-500 text-white`}>
                                        {matchingCount}
                                    </span>
                                )}

                                {globalFilter.trim() && matchingCount > 0 && activeMainTab !== tabGroup.key && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Sub-tabs Navigation */}
            {activeTabGroup && activeTabGroup.groups.length >= 1 && activeTabGroup.key !== 'essential' && (
                <div className={getColorClasses(activeTabGroup.color, 'bg') + ' border-b p-2'}>
                    <div className="flex overflow-x-auto px-6">
                        {activeTabGroup.groups.map((group) => {
                            const searchResultsCount = globalFilter.trim() ?
                                group.columns.filter(col => filteredColumns.includes(col)).length : 0;

                            return (
                                <button
                                    key={group.prefix}
                                    onClick={() => setActiveSubTabForMain(activeMainTab, group.prefix)}
                                    className={`relative flex-shrink-0 flex items-center px-4 py-3 mx-1 text-sm font-medium transition-all duration-300 transform ${
                                        activeSubTab[activeMainTab] === group.prefix
                                            ? `${getColorClasses(activeTabGroup.color, 'text')} bg-white shadow-md border-2 ${getColorClasses(activeTabGroup.color, 'border')} rounded-2xl scale-105 font-semibold m-2`
                                            : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100 hover:shadow-sm hover:scale-102 rounded-2xl border-2 border-transparent'
                                    }`}
                                >
                                    <div className={`mr-2 transition-transform duration-300 ${
                                        activeSubTab[activeMainTab] === group.prefix ? 'scale-110' : ''
                                    }`}>
                                        {group.icon}
                                    </div>
                                    <span className="whitespace-nowrap">{group.name}</span>

                                    {globalFilter.trim() && searchResultsCount > 0 ? (
                                        <span className={`ml-2 px-2 py-1 text-xs rounded-full font-medium transition-all duration-300 ${
                                            activeSubTab[activeMainTab] === group.prefix
                                                ? `bg-${activeTabGroup.color}-500 text-white shadow-sm`
                                                : 'bg-yellow-500 text-white shadow-sm'
                                        }`}>
                                            {searchResultsCount}
                                        </span>
                                    ) : (
                                        <span className="ml-2 px-2 py-1 text-xs rounded-full transition-all duration-300 bg-white bg-opacity-70 text-gray-600">
                                        </span>
                                    )}
                                </button>
                            );
                        })}

                        {/* Add button - Generic for any group */}
                        <button
                            onClick={() => {
                                const groupDef = getGroupByKey(activeTabGroup.key);
                                if (groupDef) {
                                    const newSlotNumber = addSlot(activeTabGroup.key);
                                    if (newSlotNumber && groupDef.isMultiInstance) {
                                        setActiveSubTabForMain(activeTabGroup.key, `${groupDef.prefix}_${newSlotNumber}`);
                                    }
                                }
                            }}
                            disabled={config[activeTabGroup.key] >= (getGroupByKey(activeTabGroup.key)?.maxInstances || 0)}
                            className={`flex-shrink-0 flex items-center justify-center w-10 h-10 mx-1 my-2 text-md font-medium rounded-full border-2 border-dashed transition-all duration-300 border-${activeTabGroup.color}-300 text-${activeTabGroup.color}-500 hover:bg-${activeTabGroup.color}-100 hover:border-${activeTabGroup.color}-400 hover:text-${activeTabGroup.color}-600 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105`}
                            title={`Add new ${activeTabGroup.name.toLowerCase().slice(0, -1)}`}
                        >
                            +
                        </button>
                    </div>
                </div>
            )}

            {/* Active Content */}
            <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
                {activeGroup && (
                    <div>
                        {globalFilter.trim() && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Search className="w-4 h-4 text-blue-600"/>
                                    <span className="text-sm text-blue-700">
                                        Showing {columnsToShow.length} results for "{globalFilter}" in {activeGroup?.name || activeTabGroup?.name}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Columns Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {columnsToShow.map((column, index) => {
                                const columnMappings = mappings.filter(m =>
                                    m.destination.table === table.name && m.destination.column === column
                                );

                                const displayColumn = formatColumnName(column);
                                const parsed = parseColumnName(column);
                                const groupType = parsed ? getGroupByKey(parsed.groupKey!)?.name : 'Essential';

                                // Special highlighting for created_date column
                                const isCreatedDateColumn = column === 'created_date';

                                return (
                                    <div
                                        key={index}
                                        className={`bg-white rounded-lg border-2 p-4 hover:shadow-md transition-all duration-200 cursor-pointer ${
                                            columnMappings.length > 0
                                                ? 'border-green-300 bg-green-50'
                                                : isCreatedDateColumn
                                                    ? 'border-blue-300 bg-blue-50'
                                                    : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                        onDragOver={onDragOver}
                                        onDrop={(e) => onDrop(e, table, column)}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`p-2 rounded-lg ${
                                                isCreatedDateColumn
                                                    ? 'bg-blue-100'
                                                    : getColorClasses(activeGroup.color, 'bg')
                                            }`}>
                                                <Columns className={`w-4 h-4 ${
                                                    isCreatedDateColumn
                                                        ? 'text-blue-600'
                                                        : getColorClasses(activeGroup.color, 'text')
                                                }`}/>
                                            </div>
                                            {columnMappings.length > 0 && (
                                                <div className="bg-green-100 px-2 py-1 rounded-full">
                                                    <span className="text-green-700 text-xs font-medium">
                                                        ✓ {columnMappings.length}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-2">
                                            <h4 className="font-semibold text-gray-900 text-sm mb-1" title={column}>
                                                {displayColumn}
                                            </h4>
                                            {globalFilter.trim() && (
                                                <p className="text-xs text-gray-500 mb-1">
                                                    {groupType}
                                                </p>
                                            )}
                                        </div>

                                        {columnMappings.length > 0 && (
                                            <div className="space-y-2">
                                                {columnMappings.map(mapping => (
                                                    <div key={mapping.id} className={
                                                        getColorClasses(activeGroup.color, 'bg') + ` border ${getColorClasses(activeGroup.color, 'border')} rounded p-2 text-xs`
                                                    }>
                                                        <div className="flex items-start justify-between">
                                                            <div className={`flex-1 min-w-0 ${getColorClasses(activeGroup.color, 'text')}`}>
                                                                <div className="font-medium truncate mb-1">{mapping.source.value}</div>
                                                                <div className={`text-[10px] truncate opacity-75`}>
                                                                    {mapping.source.file} → {mapping.source.sheet}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => onRemoveMapping(mapping.id)}
                                                                className="text-red-400 hover:text-red-600 ml-2 flex-shrink-0"
                                                                title="Remove mapping"
                                                            >
                                                                <Trash2 className="w-3 h-3"/>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};