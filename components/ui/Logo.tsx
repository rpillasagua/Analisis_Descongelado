import React from 'react';

interface LogoProps {
    className?: string;
    size?: number;
    variant?: 'color' | 'white';
}

export const Logo: React.FC<LogoProps> = ({
    className = '',
    size = 40,
    variant = 'color'
}) => {
    const colors = {
        primary: variant === 'color' ? '#2563EB' : '#FFFFFF', // blue-600 or white
        secondary: variant === 'color' ? '#3B82F6' : 'rgba(255, 255, 255, 0.8)', // blue-500 or white/80
        accent: variant === 'color' ? '#60A5FA' : 'rgba(255, 255, 255, 0.6)', // blue-400 or white/60
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Outer Drop Shape */}
            <path
                d="M50 5C50 5 15 45 15 65C15 84.33 30.67 100 50 100C69.33 100 85 84.33 85 65C85 45 50 5 50 5Z"
                fill={colors.primary}
                fillOpacity="0.1"
            />

            {/* Inner Crystal/Ice Structure */}
            <path
                d="M50 15L25 60L50 90L75 60L50 15Z"
                fill={colors.secondary}
                fillOpacity="0.9"
            />

            {/* Highlight/Reflection */}
            <path
                d="M50 15L35 55L50 75L50 15Z"
                fill={colors.accent}
                fillOpacity="0.5"
            />

            {/* Snowflake/Frost detail in center */}
            <path
                d="M50 45V75M35 60H65"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
            />
        </svg>
    );
};

export default Logo;
