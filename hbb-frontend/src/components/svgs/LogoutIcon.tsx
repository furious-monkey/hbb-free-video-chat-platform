export const LogoutIcon: React.FC<{
  className?: string;
}> = ({ className = "" }) => {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="16" fill="white" fillOpacity="0.13" />
      <path
        d="M12.25 13V9.25C12.25 8.65326 12.4871 8.08097 12.909 7.65901C13.331 7.23705 13.9033 7 14.5 7H20.5C21.0967 7 21.669 7.23705 22.091 7.65901C22.5129 8.08097 22.75 8.65326 22.75 9.25V22.75C22.75 23.3467 22.5129 23.919 22.091 24.341C21.669 24.7629 21.0967 25 20.5 25H14.5C13.9033 25 13.331 24.7629 12.909 24.341C12.4871 23.919 12.25 23.3467 12.25 22.75V19M9.25 19L6.25 16M6.25 16L9.25 13M6.25 16H19"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
