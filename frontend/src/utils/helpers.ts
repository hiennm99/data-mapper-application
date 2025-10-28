import {COLUMN_GROUPS, type ColumnGroupDefinition} from "@config";
import {getGroupIcon} from "@utils/iconConverter.tsx";
import type {ReactNode} from "react";

export function formatColumnName(column: string): string {
    // Lấy toàn bộ chữ (bỏ số và ký tự đặc biệt)
    const column_text = column.match(/[A-Za-z]+/g);

    if (!column_text) return column; // Trường hợp không có chữ

    return column_text
        .join("_") // Ghép lại thành "snake_case"
        .split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export interface ArrayMappingConfig {
    title: string;
    icon: ReactNode;
    colorClass: string;
}

/**
 * Helper to generate config from COLUMN_GROUPS
 */
export const generateArrayMappingConfig = (groupKey: string): ArrayMappingConfig | null => {
    const group = getGroupByKey(groupKey);
    if (!group) return null;

    // Map color names to gradient classes
    const colorGradients: Record<string, string> = {
        blue: "bg-gradient-to-r from-blue-500 to-blue-600",
        green: "bg-gradient-to-r from-green-500 to-green-600",
        purple: "bg-gradient-to-r from-purple-500 to-purple-600",
        orange: "bg-gradient-to-r from-orange-500 to-orange-600",
        indigo: "bg-gradient-to-r from-indigo-500 to-indigo-600",
        red: "bg-gradient-to-r from-red-500 to-red-600",
        yellow: "bg-gradient-to-r from-yellow-500 to-yellow-600",
        pink: "bg-gradient-to-r from-pink-500 to-pink-600",
        teal: "bg-gradient-to-r from-teal-500 to-teal-600",
        emerald: "bg-gradient-to-r from-emerald-500 to-emerald-600",
    };

    return {
        title: group.name + 's', // Pluralize
        icon: getGroupIcon(group.iconName, "w-5 h-5 text-white"),
        colorClass: colorGradients[group.color] || "bg-gradient-to-r from-gray-500 to-gray-600"
    };
};

/**
 * Get all array mapping keys dynamically
 */
export const getArrayMappingKeys = (): string[] => {
    return COLUMN_GROUPS
        .filter(group => group.isMultiInstance || group.key === 'finance')
        .map(group => group.key);
};

/**
 * Utility functions
 */
export const toStr = (v: unknown): string => (v == null ? "" : String(v));

export const shortId = (id: unknown, take = 8): string => {
    const s = toStr(id);
    return !s ? "N/A" : s.length > take ? `${s.slice(0, take)}...` : s;
};

export const normalizeDateInput = (v: string | number | Date): string => {
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "number") return new Date(v).toISOString();
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toISOString();
};

export const capitalizeLabel = (str: string): string =>
    str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

/**
 * Get Tailwind color classes for a given color and variant
 */
export const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' | 'hover'): string => {
    const colorMap = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-500', hover: 'hover:bg-blue-100' },
        green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-500', hover: 'hover:bg-green-100' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-500', hover: 'hover:bg-purple-100' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-500', hover: 'hover:bg-orange-100' },
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-500', hover: 'hover:bg-indigo-100' },
        red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-500', hover: 'hover:bg-red-100' },
        yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-500', hover: 'hover:bg-yellow-100' },
        pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-500', hover: 'hover:bg-pink-100' },
        teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-500', hover: 'hover:bg-teal-100' }
    };
    return colorMap[color as keyof typeof colorMap]?.[variant] || colorMap.blue[variant];
};

/**
 * Column group utility functions
 */
export const getGroupByKey = (key: string): ColumnGroupDefinition | undefined => {
    return COLUMN_GROUPS.find(group => group.key === key);
};

export const getGroupByPrefix = (prefix: string): ColumnGroupDefinition | undefined => {
    return COLUMN_GROUPS.find(group => group.prefix === prefix);
};

export const parseColumnName = (columnName: string): { groupKey?: string; instanceNumber?: number; field?: string; prefix?: string } | null => {
    // Try to match multi-instance pattern: prefix_number_field
    for (const group of COLUMN_GROUPS) {
        if (group.isMultiInstance) {
            const regex = new RegExp(`^${group.prefix}_(\\d+)_(.+)$`);
            const match = columnName.match(regex);
            if (match) {
                return {
                    groupKey: group.key,
                    prefix: group.prefix,
                    instanceNumber: parseInt(match[1]),
                    field: match[2]
                };
            }
        } else {
            // Single instance pattern: prefix_field
            const regex = new RegExp(`^${group.prefix}_(.+)$`);
            const match = columnName.match(regex);
            if (match) {
                return {
                    groupKey: group.key,
                    prefix: group.prefix,
                    field: match[1]
                };
            }
        }
    }
    return null;
};