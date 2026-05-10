export function AiraMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      aria-label="Aira"
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.4 27.4C5.7 22 7.1 15.2 12.2 11.7c5.4-3.7 12.8-2.4 16.5 3 3.7 5.3 2.6 12.5-2.5 16.3-3.4 2.5-7.7 2.9-11.2 1.3l-6 4.2 1.4-7.1Z"
        fill="#4C44B8"
      />
      <path
        d="m14 22 5.1 5.3L30.6 12"
        stroke="#FFFEFB"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="31.5" cy="10.5" r="5.7" fill="#DC8B3F" stroke="#FAF6EE" strokeWidth="1.5" />
      <path d="M31.5 7.8v5.4M28.8 10.5h5.4" stroke="#FFFEFB" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
