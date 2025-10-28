// src/utils/iconConverter.tsx - Icon mapping utility
import {
    AlertCircle,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    Award,
    Bell,
    Bookmark,
    Briefcase,
    Building2,
    Calendar,
    Car,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Clock,
    Copy,
    CreditCard,
    DollarSign,
    Download,
    Edit,
    ExternalLink,
    Eye,
    EyeOff,
    FileText,
    Filter,
    Flag,
    Globe,
    Grid,
    Heart,
    HelpCircle,
    Home,
    Info,
    Layers,
    Link,
    List,
    Lock,
    Mail,
    MapPin,
    Minus,
    MoreHorizontal,
    MoreVertical,
    Package,
    Phone,
    Plus,
    Save,
    Search,
    Settings,
    Shield,
    Star,
    Tag,
    Target,
    Trash2,
    TrendingUp,
    Unlock,
    Upload,
    User,
    Users,
    XCircle,
    Zap} from 'lucide-react';
import React from 'react';

// Icon mapping for all possible icons used in the application
export const iconMap = {
    // Group-specific icons
    Users,
    Shield,
    Home,
    Briefcase,
    DollarSign,
    MapPin,
    Phone,
    Building2,

    // Additional common icons
    User,
    FileText,
    Calendar,
    CreditCard,
    Car,
    Package,
    TrendingUp,
    Settings,
    Info,
    HelpCircle,
    AlertCircle,
    CheckCircle,
    XCircle,
    Plus,
    Minus,
    Edit,
    Trash2,
    Search,
    Filter,
    Download,
    Upload,
    Save,
    Copy,
    Eye,
    EyeOff,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ExternalLink,
    Link,
    Mail,
    Globe,
    Lock,
    Unlock,
    Bell,
    Star,
    Heart,
    Bookmark,
    Tag,
    Flag,
    Clock,
    Zap,
    Target,
    Award,
    Layers,
    Grid,
    List,
    MoreHorizontal,
    MoreVertical
};

export type IconName = keyof typeof iconMap;

/**
 * Get icon component by name with optional className
 */
export const getIcon = (iconName: string, className?: string): React.ReactNode => {
    const IconComponent = iconMap[iconName as IconName];

    if (!IconComponent) {
        console.warn(`Icon "${iconName}" not found. Using default User icon.`);
        return <User className={className || "w-4 h-4"} />;
    }

    return <IconComponent className={className || "w-4 h-4"} />;
};

/**
 * Get icon component for column groups with fallback
 */
export const getGroupIcon = (iconName: string, className?: string): React.ReactNode => {
    // Map of group-specific icon fallbacks
    const groupIconFallbacks: Record<string, IconName> = {
        'Address': 'MapPin',
        'Home': 'Home',
        'Shield': 'Shield',
        'Briefcase': 'Briefcase',
        'DollarSign': 'DollarSign',
        'Phone': 'Phone',
        'Building2': 'Building2',
        'Users': 'Users',
        'User': 'User',
        'MapPin': 'MapPin'
    };

    const fallbackIcon = groupIconFallbacks[iconName] || 'User';
    return getIcon(iconName, className) || getIcon(fallbackIcon, className);
};