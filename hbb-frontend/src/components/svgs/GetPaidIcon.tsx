import React from "react";

interface GetPaidIconProps {
  className?: string;
}

export const GetPaidIcon = ({ className = "" }: GetPaidIconProps) => {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="16" fill="white" fill-opacity="0.13" />
      <g clip-path="url(#clip0_2699_16138)">
        <path
          d="M13.5 17.7502C13.5 18.7202 14.25 19.5002 15.17 19.5002H17.05C17.85 19.5002 18.5 18.8202 18.5 17.9702C18.5 17.0602 18.1 16.7302 17.51 16.5202L14.5 15.4702C13.91 15.2602 13.51 14.9402 13.51 14.0202C13.51 13.1802 14.16 12.4902 14.96 12.4902H16.84C17.76 12.4902 18.51 13.2702 18.51 14.2402"
          stroke="white"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M16 11.5V20.5"
          stroke="white"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M26 16C26 21.52 21.52 26 16 26C10.48 26 6 21.52 6 16C6 10.48 10.48 6 16 6"
          stroke="white"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M26 10V6H22"
          stroke="white"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M21 11L26 6"
          stroke="white"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_2699_16138">
          <rect
            width="24"
            height="24"
            fill="white"
            transform="translate(4 4)"
          />
        </clipPath>
      </defs>
    </svg>
  );
};
