export const CardDetailsIcon: React.FC<{
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
        d="M6.25 12.25H25.75M6.25 13H25.75M9.25 18.25H15.25M9.25 20.5H12.25M8.5 23.5H23.5C24.0967 23.5 24.669 23.2629 25.091 22.841C25.5129 22.419 25.75 21.8467 25.75 21.25V10.75C25.75 10.1533 25.5129 9.58097 25.091 9.15901C24.669 8.73705 24.0967 8.5 23.5 8.5H8.5C7.90326 8.5 7.33097 8.73705 6.90901 9.15901C6.48705 9.58097 6.25 10.1533 6.25 10.75V21.25C6.25 21.8467 6.48705 22.419 6.90901 22.841C7.33097 23.2629 7.90326 23.5 8.5 23.5Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
