// src/config/columnGroups.ts - Centralized column group configuration
export interface ColumnGroupDefinition {
    key: string;
    name: string;
    iconName: string; // Changed from icon to iconName
    color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'red' | 'yellow' | 'pink' | 'teal';
    maxInstances: number;
    defaultInstances: number; // Default number of instances when initializing
    fields: string[];
    prefix: string;
    isMultiInstance: boolean;
}

export const COLUMN_GROUPS: ColumnGroupDefinition[] = [
    {
        key: 'addresses',
        name: 'Address',
        iconName: 'MapPin',
        color: 'orange',
        maxInstances: 10,
        defaultInstances: 1,
        prefix: 'address',
        isMultiInstance: true,
        fields: [
            'country', 'province', 'city', 'street',
            'note'
        ]
    },
    {
        key: 'contacts',
        name: 'Contact',
        iconName: 'Phone',
        color: 'orange',
        maxInstances: 10,
        defaultInstances: 1,
        prefix: 'contact',
        isMultiInstance: true,
        fields: [
            'phone_number', 'email', 'is_pec', 'is_verified',
            'note'
        ]
    },
    {
        key: 'banks',
        name: 'Bank',
        iconName: 'Building2',
        color: 'orange',
        maxInstances: 10,
        defaultInstances: 1,
        prefix: 'bank',
        isMultiInstance: true,
        fields: [
            'fiscal_code',
            'country', 'province', 'city', 'street',
            'bank_name', 'bank_abi', 'bank_cab', 'account_number', 'account_type',
            'note'
        ]
    },
    {
        key: 'guarantors',
        name: 'Guarantor',
        iconName: 'Shield',
        color: 'green',
        maxInstances: 10,
        defaultInstances: 3,
        prefix: 'guarantor',
        isMultiInstance: true,
        fields: [
            'fiscal_code', 'surname', 'name', 'ndg',
            'type', 'limit',
            'note'
        ]
    },
    {
        key: 'joints',
        name: 'Joints',
        iconName: 'Users',
        color: 'purple',
        maxInstances: 10,
        defaultInstances: 3,
        prefix: 'joint',
        isMultiInstance: true,
        fields: [
            'fiscal_code', 'surname', 'name', 'ndg',
            'note'
        ]
    },
    {
        key: 'assets',
        name: 'Asset',
        iconName: 'Home',
        color: 'orange',
        maxInstances: 10,
        defaultInstances: 3,
        prefix: 'asset',
        isMultiInstance: true,
        fields: [
            'type', 'ownership',
            'est_asset_value', 'est_ownership_value',
            'country', 'province', 'city', 'street',
            'sheet', 'particle_sub', 'sub', 'dimension', 'category', 'class',
            'cadastral_tax_base', 'square_meter', 'vain', 'zone', 'compr_avg',
            'note'
        ]
    },
    {
        key: 'jobs',
        name: 'Job',
        iconName: 'Briefcase',
        color: 'indigo',
        maxInstances: 5,
        defaultInstances: 1,
        prefix: 'job',
        isMultiInstance: true,
        fields: [
            'reference', 'pension_category', 'employer_name', 'start_date', 'end_date',
            'income_range', 'monthly_income', 'work_activity_notes', 'employer_vat_number', 'employer_tax_code', 'employer_phone', 'employer_fax',
            'legal_street_type', 'legal_street', 'legal_street_number', 'legal_at', 'legal_city', 'legal_province',
            'operation_street_type', 'operation_street', 'operation_street_number', 'operation_at', 'operation_city', 'operation_province',
            'note'
        ]
    },
    {
        key: 'finance',
        name: 'Finance',
        iconName: 'DollarSign',
        color: 'red',
        maxInstances: 2,
        defaultInstances: 1,
        prefix: 'finance',
        isMultiInstance: false,
        fields: [
            'supplier_evaluation', 'bank_account',
            'ongoing_garnishments', 'garnishment_amount', 'garnishment_expiration_date', 'garnishment_notes',
            'ongoing_assignments', 'assignment_amount', 'assignment_expiration_date', 'assignment_notes',
            'fixed_term_contract_expiry_date', 'contract_type',
            'note'
        ]
    }
];

// Base columns that don't belong to any group - ADDED created_date
export const BASE_COLUMNS = [
    'fiscal_code', 'surname', 'name', 'vat_number',
    'ndg', 'gbv', 'dbt_data', 'originator', 'credit_type', 'is_verified', 'created_date',
    'note'
];

// Add the missing ALL_BASE_COLUMNS export
export const ALL_BASE_COLUMNS = BASE_COLUMNS;