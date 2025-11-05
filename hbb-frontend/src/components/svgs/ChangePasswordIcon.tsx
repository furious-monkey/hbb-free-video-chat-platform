export const ChangePasswordIcon: React.FC<{
  className?: string;
}> = ({ className = "" }) => {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="16" fill="white" fillOpacity="0.13" />
      <path
        d="M20.5 14.5V10.75C20.5 9.55653 20.0259 8.41193 19.182 7.56802C18.3381 6.72411 17.1935 6.25 16 6.25C14.8065 6.25 13.6619 6.72411 12.818 7.56802C11.9741 8.41193 11.5 9.55653 11.5 10.75V14.5M10.75 25.75H21.25C21.8467 25.75 22.419 25.5129 22.841 25.091C23.2629 24.669 23.5 24.0967 23.5 23.5V16.75C23.5 16.1533 23.2629 15.581 22.841 15.159C22.419 14.7371 21.8467 14.5 21.25 14.5H10.75C10.1533 14.5 9.58097 14.7371 9.15901 15.159C8.73705 15.581 8.5 16.1533 8.5 16.75V23.5C8.5 24.0967 8.73705 24.669 9.15901 25.091C9.58097 25.5129 10.1533 25.75 10.75 25.75Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
