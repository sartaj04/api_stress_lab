'use client';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
    const sizes = {
        sm: { icon: 24, text: 'text-base' },
        md: { icon: 32, text: 'text-lg' },
        lg: { icon: 48, text: 'text-2xl' },
    };

    const { icon, text } = sizes[size];
    const gradientId = `speedometer-gradient-${size}`;

    return (
        <div className="flex items-center gap-2">
            {/* Clean speedometer - matches favicon */}
            <svg
                width={icon}
                height={icon}
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Outer arc */}
                <path
                    d="M5 22 A11 11 0 1 1 27 22"
                    stroke={`url(#${gradientId})`}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                />
                {/* Needle */}
                <line
                    x1="16"
                    y1="19"
                    x2="24"
                    y2="11"
                    stroke={`url(#${gradientId})`}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                {/* Center dot */}
                <circle cx="16" cy="19" r="2.5" fill={`url(#${gradientId})`} />
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                </defs>
            </svg>
            {showText && (
                <span className={`font-semibold text-white ${text}`}>
                    API Stress Lab
                </span>
            )}
        </div>
    );
}

