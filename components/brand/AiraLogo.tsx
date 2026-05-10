"use client";

interface AiraLogoProps {
  size?: number;
  className?: string;
}

export function AiraLogo({ size = 32, className = "" }: AiraLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Aira logo"
    >
      {/* Chat bubble shape */}
      <path
        d="M4 8C4 5.79 5.79 4 8 4H32C34.21 4 36 5.79 36 8V26C36 28.21 34.21 30 32 30H22L14 36V30H8C5.79 30 4 28.21 4 26V8Z"
        fill="#4C44B8"
      />
      {/* Serif lowercase "a" */}
      <text
        x="20"
        y="23"
        textAnchor="middle"
        fill="#FFFEFB"
        fontFamily="Newsreader, Georgia, serif"
        fontSize="16"
        fontWeight="400"
        fontStyle="italic"
      >
        a
      </text>
    </svg>
  );
}

export function AiraLogoLarge({ size = 56, className = "" }: AiraLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Aira logo"
    >
      <path
        d="M6 12C6 8.69 8.69 6 12 6H44C47.31 6 50 8.69 50 12V36C50 39.31 47.31 42 44 42H30L20 50V42H12C8.69 42 6 39.31 6 36V12Z"
        fill="#4C44B8"
      />
      <text
        x="28"
        y="32"
        textAnchor="middle"
        fill="#FFFEFB"
        fontFamily="Newsreader, Georgia, serif"
        fontSize="22"
        fontWeight="400"
        fontStyle="italic"
      >
        a
      </text>
    </svg>
  );
}
