'use client';

import Image from 'next/image';

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

    return (
        <div className="flex items-center gap-2">
            <Image
                src="/logo.png"
                alt="API Stress Lab"
                width={icon}
                height={icon}
                className="flex-shrink-0"
                priority
                unoptimized
            />
            {showText && (
                <span className={`font-semibold text-white ${text}`}>
                    API Stress Lab
                </span>
            )}
        </div>
    );
}

