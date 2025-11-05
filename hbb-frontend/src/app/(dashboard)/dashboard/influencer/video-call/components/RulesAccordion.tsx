// dashboard/influencer/video-call/components/RulesAccordion.tsx - Fixed version with proper click handling
import React, { useState, useCallback } from "react";

const RulesAccordion = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Rules accordion clicked, current state:", isOpen);
    setIsOpen(prev => !prev);
  }, [isOpen]);

  // SVG Icons for Open and Close states
  const OpenIcon = ({ className }: { className?: string }) => (
    <svg
      className={className}
      width="14"
      height="10"
      viewBox="0 0 14 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.3011 3.19327L10.7039 1.54895C10.6838 1.52826 10.6563 1.51642 10.6275 1.51599C10.5986 1.51556 10.5708 1.52666 10.5501 1.54671L4.62726 7.301L6.37622 9.10156L12.2991 3.3473C12.3093 3.33732 12.3175 3.32543 12.3232 3.31226C12.3288 3.29914 12.3318 3.285 12.332 3.27071C12.3322 3.25636 12.3296 3.24218 12.3243 3.2289C12.3189 3.21562 12.3111 3.20346 12.3011 3.19327Z"
        fill="black"
      />
      <path
        d="M2.28243 1.41412L0.601795 3.04692C0.593955 3.05455 0.587661 3.06367 0.583341 3.0737C0.579021 3.08372 0.576675 3.09455 0.576515 3.10548C0.576355 3.11642 0.578381 3.1273 0.582435 3.13743C0.586435 3.14762 0.592461 3.1569 0.600088 3.16474L6.3715 9.10645L8.17188 7.35733L2.40046 1.41562C2.39278 1.40772 2.38372 1.40143 2.37364 1.39711C2.36356 1.39279 2.35273 1.3905 2.34174 1.39034C2.33081 1.39023 2.31993 1.3922 2.30974 1.39631C2.29956 1.40036 2.29027 1.40644 2.28243 1.41412Z"
        fill="black"
      />
      <path
        d="M13.43 2.77921L11.8328 1.13489C11.8127 1.11419 11.7852 1.10235 11.7564 1.10193C11.7275 1.1015 11.6997 1.11259 11.679 1.13265L5.75615 6.88694L7.50511 8.6875L13.428 2.93323C13.4382 2.92326 13.4464 2.91137 13.4521 2.89819C13.4577 2.88507 13.4607 2.87094 13.4609 2.85665C13.4611 2.8423 13.4585 2.82811 13.4532 2.81483C13.4478 2.80155 13.44 2.78945 13.43 2.77921Z"
        fill="#E687A3"
        stroke="black"
        strokeMiterlimit="10"
      />
      <path
        d="M3.41129 1.00005L1.73065 2.63285C1.72281 2.64048 1.71651 2.6496 1.71219 2.65963C1.70787 2.66971 1.70553 2.68048 1.70537 2.69141C1.70521 2.70234 1.70723 2.71323 1.71129 2.72336C1.71529 2.73355 1.72131 2.74283 1.72894 2.75067L7.50035 8.69238L9.30078 6.94325L3.52931 1.00154C3.52169 0.993651 3.51257 0.987358 3.50249 0.983038C3.49241 0.978718 3.48158 0.976425 3.47059 0.976265C3.45966 0.976158 3.44878 0.978185 3.43859 0.982238C3.42841 0.986345 3.41913 0.992371 3.41129 1.00005Z"
        fill="#F2EE98"
        stroke="black"
        strokeMiterlimit="10"
      />
    </svg>
  );

  const CloseIcon = ({ className }: { className?: string }) => (
    <svg
      className={className}
      width="14"
      height="10"
      viewBox="0 0 14 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.70284 6.80673L3.30001 8.45105C3.32011 8.47174 3.3476 8.48358 3.37644 8.48401C3.40529 8.48444 3.43312 8.47334 3.45381 8.45329L9.37665 2.699L7.62769 0.898437L1.70485 6.6527C1.69458 6.66268 1.68639 6.67457 1.68073 6.68774C1.67507 6.70086 1.67207 6.715 1.67188 6.72929C1.6717 6.74364 1.67434 6.75782 1.67965 6.7711C1.68497 6.78438 1.69284 6.79654 1.70284 6.80673Z"
        fill="#4B4B4A"
      />
      <path
        d="M11.7176 8.5849L13.3982 6.9521C13.406 6.94447 13.4123 6.93535 13.4167 6.92533C13.421 6.9153 13.4233 6.90447 13.4235 6.89354C13.4236 6.88261 13.4216 6.87173 13.4176 6.86159C13.4136 6.85141 13.4075 6.84213 13.3999 6.83429L7.6285 0.892578L5.82812 2.6417L11.5995 8.58341C11.6072 8.5913 11.6163 8.59759 11.6264 8.60191C11.6364 8.60623 11.6473 8.60853 11.6583 8.60869C11.6692 8.60879 11.6801 8.60682 11.6903 8.60271C11.7004 8.59866 11.7097 8.59258 11.7176 8.5849Z"
        fill="#4B4B4A"
      />
      <path
        d="M0.570048 7.22079L2.16721 8.86511C2.18731 8.88581 2.21481 8.89765 2.24365 8.89807C2.27249 8.8985 2.30031 8.88741 2.321 8.86735L8.24385 3.11306L6.49489 1.3125L0.572042 7.06677C0.561776 7.07674 0.553584 7.08863 0.547925 7.10181C0.542266 7.11493 0.539258 7.12906 0.539072 7.14335C0.538885 7.1577 0.541525 7.17189 0.546842 7.18517C0.552154 7.19845 0.560042 7.21055 0.570048 7.22079Z"
        fill="#727271"
        stroke="#4B4B4A"
        strokeMiterlimit="10"
      />
      <path
        d="M10.5848 8.99897L12.2654 7.36617C12.2733 7.35855 12.2796 7.34943 12.2839 7.3394C12.2882 7.32932 12.2906 7.31855 12.2907 7.30761C12.2909 7.29668 12.2889 7.2858 12.2848 7.27566C12.2808 7.26548 12.2748 7.2562 12.2672 7.24836L6.49574 1.30664L4.69531 3.05577L7.58105 6.02663L10.4668 8.99748C10.4744 9.00537 10.4835 9.01167 10.4936 9.01599C10.5037 9.02031 10.5145 9.0226 10.5255 9.02276C10.5364 9.02287 10.5473 9.02084 10.5575 9.01679C10.5677 9.01268 10.577 9.00665 10.5848 8.99897Z"
        fill="#C6C6C6"
        stroke="#4B4B4A"
        strokeMiterlimit="10"
      />
    </svg>
  );

  return (
    <div
      className="absolute top-20 lg:top-[118px] 2xl:top-[196px] mx-4 lg:mx-0 lg:right-16 2xl:right-24 px-2 lg:px-4 py-2 lg:py-3 
                 bg-black bg-opacity-80 backdrop-blur-[32px] rounded-sm lg:rounded-xl text-white 
                 lg:w-[320px] flex-shrink-0 z-40" // Added z-40 to ensure it's above other elements
      style={{ borderRadius: "16px" }}
    >
      <div
        className="flex justify-between items-center cursor-pointer select-none" // Added select-none
        onClick={toggleAccordion}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleAccordion(e as any);
          }
        }}
      >
        <h2 className="font-normal text-sm lg:text-lg pointer-events-none">Rules</h2>
        <button 
          className="flex justify-center items-center rounded-lg bg-white !h-6 !w-6 lg:!h-7 lg:!w-7 focus:outline-none hover:bg-gray-100 transition-colors"
          type="button"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close rules" : "Open rules"}
        >
          {isOpen ? (
            <CloseIcon className="!h-3 !w-3 lg:!h-4 lg:!w-4 flex justify-center items-center pointer-events-none" />
          ) : (
            <OpenIcon className="!h-3 !w-3 lg:!h-4 lg:!w-4 flex justify-center items-center pointer-events-none" />
          )}
        </button>
      </div>

      {/* Entire Accordion List */}
      <div
        className={`overflow-hidden transition-all duration-500 ${
          isOpen ? "max-h-[500px] mt-4 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="custom-list mt-4 text-xs leading-relaxed !h-[40vh] lg:!h-[70vh] 2xl:!h-[60vh] overflow-y-auto no-scrollbar !pl-0">
          <li>
            Don't be weird - Conduct yourself in a respectful manner. This
            includes no nudity, no inappropriate comments or requests, etc. HBB
            reserves the right to determine what constitutes as "weird."
          </li>
          <li>
            Don't be disrespectful - Treat others with respect.
          </li>
          <li>
            Don't do anything illegal - Illegal activities will result in a
            permanent ban from HBB and will be reported to law enforcement.
          </li>
          <li>
            Don't record calls without express consent - You must obtain consent
            from all parties to record calls.
          </li>
          <li>
            No ding dong ditching - Do not bid on or start calls that you do not
            intend to finish. Immediately exiting a call will result in a fine
            equal to the price of the call, and repeated complaints of this will
            result in a ban from HBB.
          </li>
          <p>
            Failure to abide by these rules will result in a suspension or
            termination of your account.
          </p>
        </ul>
      </div>
    </div>
  );
};

export default RulesAccordion;