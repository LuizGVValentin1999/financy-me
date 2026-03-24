import { SVGAttributes } from 'react';

export default function ApplicationLogo(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
        >
            <rect x="4" y="4" width="56" height="56" rx="18" fill="currentColor" opacity="0.12" />
            <path d="M18 24.5C18 21.4624 20.4624 19 23.5 19H40.5C43.5376 19 46 21.4624 46 24.5V28H18V24.5Z" fill="currentColor" />
            <path d="M18 31H46V41.5C46 44.5376 43.5376 47 40.5 47H23.5C20.4624 47 18 44.5376 18 41.5V31Z" fill="currentColor" opacity="0.92" />
            <path d="M24 36H29" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <circle cx="39" cy="39" r="5" fill="#E07A5F" />
        </svg>
    );
}
