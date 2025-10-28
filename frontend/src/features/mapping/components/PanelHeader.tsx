// components/PanelHeader.tsx - Reusable panel header component
import type {LucideIcon} from 'lucide-react';
import React, {type ReactNode } from 'react';

interface PanelHeaderProps {
    icon: LucideIcon;
    title: string;
    gradient: string;
    children?: ReactNode;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
                                                            icon: Icon,
                                                            title,
                                                            gradient,
                                                            children
                                                        }) => {
    return (
        <div className={`${gradient} text-white p-4 flex items-center justify-between`}>
            <div className="flex items-center">
                <Icon className="w-5 h-5 mr-2" />
                <h2 className="text-lg font-semibold">{title}</h2>
            </div>
            {children}
        </div>
    );
};