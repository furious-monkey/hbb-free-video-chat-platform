export const TwitchIcon: React.FC<{
  className?: string;
}> = ({ className = "" }) => {
  return (
    <svg
      className={className}
      width="49"
      height="34"
      viewBox="0 0 49 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="49" height="34" rx="16.5" fill="white" fill-opacity="0.2" />
      <path
        d="M20.0011 7L16.4297 10.5714V23.4286H20.7154V27L24.2868 23.4286H27.144L33.5725 17V7H20.0011ZM32.144 16.2857L29.2868 19.1429H26.4297L23.9297 21.6429V19.1429H20.7154V8.42857H32.144V16.2857Z"
        fill="white"
      />
      <path
        d="M29.9989 10.9286H28.5703V15.2143H29.9989V10.9286Z"
        fill="white"
      />
      <path
        d="M26.0692 10.9286H24.6406V15.2143H26.0692V10.9286Z"
        fill="white"
      />
    </svg>
  );
};
