import React from 'react';

const UserIcon = () => (
    <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: 'hsl(var(--accent))',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        border: '2px solid white'
    }}>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="hsl(var(--accent-foreground))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    </div>
);

export default UserIcon;
