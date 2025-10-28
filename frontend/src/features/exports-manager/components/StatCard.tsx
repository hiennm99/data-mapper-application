import React, { memo } from "react";

interface StatCardProps {
    icon: React.ReactNode;
    value: number | string;
    label: string;
    bgColor: string;
}

export const StatCard = memo(({
    icon,
    value,
    label,
    bgColor
}: StatCardProps) => (
    <div className="text-center">
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mx-auto mb-2`}>
            {icon}
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
    </div>
));

StatCard.displayName = 'StatCard';
