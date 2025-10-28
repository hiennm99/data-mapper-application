// src/utils/columnGroupManager.ts - Utility for managing column groups
import { COLUMN_GROUPS, type ColumnGroupDefinition } from "@config";

export class ColumnGroupManager {
    /**
     * Add a new column group to the configuration
     * This is a helper function for development - in production,
     * you would add directly to the COLUMN_GROUPS array
     */
    static addNewGroup(groupDefinition: ColumnGroupDefinition): void {
        // In a real implementation, this might update a database or config file
        console.log('Adding new group:', groupDefinition);

        // For development, you can use this to validate your group definition
        this.validateGroup(groupDefinition);
    }

    /**
     * Validate a group definition
     */
    static validateGroup(group: ColumnGroupDefinition): boolean {
        const errors: string[] = [];

        if (!group.key) {
            errors.push('Group key is required');
        }

        if (!group.name) {
            errors.push('Group name is required');
        }

        if (!group.prefix) {
            errors.push('Group prefix is required');
        }

        if (!Array.isArray(group.fields) || group.fields.length === 0) {
            errors.push('Group must have at least one field');
        }

        if (group.maxInstances < 1) {
            errors.push('maxInstances must be a positive number');
        }

        // Check for duplicate keys/prefixes
        const existingGroup = COLUMN_GROUPS.find(g =>
            g.key === group.key || g.prefix === group.prefix
        );
        if (existingGroup) {
            errors.push(`Group with key "${group.key}" or prefix "${group.prefix}" already exists`);
        }

        if (errors.length > 0) {
            console.error('Group validation errors:', errors);
            return false;
        }

        console.log('✅ Group validation passed');
        return true;
    }

}