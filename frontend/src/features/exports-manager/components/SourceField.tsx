import React, { memo } from "react";

interface SourceFieldProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    colorBorder: string;
    colorText: string;
}

export const SourceField = memo(({
    icon,
    label,
    value,
    colorBorder,
    colorText
}: SourceFieldProps) => (
    <div className="space-y-2">
        <div className="flex items-center">
            {icon}
            <span className="text-xs font-semibold text-gray-600 uppercase">{label}</span>
        </div>
        <div className={`bg-white p-3 rounded-lg border ${colorBorder}`}>
            <code className={`text-xs ${colorText} break-all font-medium`}>
                {value}
            </code>
        </div>
    </div>
));

SourceField.displayName = 'SourceField';
