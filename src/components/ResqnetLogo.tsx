import React from 'react';

type ResqnetLogoProps = {
    size?: number;
    showWordmark?: boolean;
    compact?: boolean;
};

export const ResqnetLogo: React.FC<ResqnetLogoProps> = ({
    size = 42,
    showWordmark = true,
    compact = false,
}) => {
    return (
        <div className={`resqnet-brand ${compact ? 'resqnet-brand-compact' : ''}`}>
            <svg
                className="resqnet-logo-mark"
                width={size}
                height={size}
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <defs>
                    <linearGradient
                        id="resqnetLogoGradient"
                        x1="7"
                        y1="7"
                        x2="42"
                        y2="42"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="#38BDF8" />
                        <stop offset="0.52" stopColor="#8B5CF6" />
                        <stop offset="1" stopColor="#F43F5E" />
                    </linearGradient>

                    <linearGradient
                        id="resqnetLogoSurface"
                        x1="4"
                        y1="2"
                        x2="44"
                        y2="46"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="#172033" />
                        <stop offset="1" stopColor="#0D1422" />
                    </linearGradient>
                </defs>

                <rect
                    x="1"
                    y="1"
                    width="46"
                    height="46"
                    rx="13"
                    fill="url(#resqnetLogoSurface)"
                    stroke="url(#resqnetLogoGradient)"
                    strokeOpacity="0.7"
                />

                <path
                    d="M14 34V14H24.5C30.3 14 34 17.1 34 22C34 25.3 32.2 27.8 29.2 29L35 34"
                    stroke="url(#resqnetLogoGradient)"
                    strokeWidth="3.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                <path
                    d="M14 24H24.3"
                    stroke="#F8FAFC"
                    strokeWidth="3.1"
                    strokeLinecap="round"
                />

                <circle cx="14" cy="14" r="2.25" fill="#38BDF8" />
                <circle cx="34" cy="22" r="2.25" fill="#8B5CF6" />
                <circle cx="35" cy="34" r="2.25" fill="#F43F5E" />
            </svg>

            {showWordmark && (
                <div className="resqnet-wordmark">
                    <span className="resqnet-wordmark-title">RESQNET</span>

                    {!compact && (
                        <span className="resqnet-wordmark-subtitle">
                            Team No Free Lunch · EL-02
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};