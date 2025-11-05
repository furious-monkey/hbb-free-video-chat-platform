// dashboard/influencer/video-call/components/Earnings.tsx - Fixed horizontal layout above Rules
import { Input } from "@/src/components/ui/input";
import React from "react";

interface EarningsProps {
  videoEarnings?: number;
  giftEarnings?: number;
}

const Earnings: React.FC<EarningsProps> = ({ 
  videoEarnings = 0, 
  giftEarnings = 0 
}) => {
  // SVG Icons
  const VideoIcon = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      className={className}
    >
      <path
        d="M24.4527 10.4805H7.42035C5.08477 10.4805 3.19141 12.3737 3.19141 14.709V27.3003C3.19141 29.6357 5.08477 31.5289 7.42035 31.5289H24.4527C26.7883 31.5289 28.6817 29.6357 28.6817 27.3003V14.709C28.6817 12.3737 26.7883 10.4805 24.4527 10.4805Z"
        fill="black"
      />
      <path
        d="M34.0643 15.169L31.71 17.0415C31.3911 17.2949 31.1335 17.6171 30.9564 17.9839C30.7794 18.3508 30.6875 18.7529 30.6875 19.1602V23.6121C30.6875 24.0827 30.8102 24.5452 31.0435 24.954C31.2768 25.3627 31.6126 25.7036 32.0178 25.943L34.1592 27.2083C34.2854 27.2835 34.4295 27.3239 34.5764 27.3252C34.7234 27.3266 34.8681 27.289 34.9959 27.2162C35.1235 27.1434 35.2296 27.0381 35.3033 26.9109C35.3771 26.7837 35.4158 26.6393 35.4155 26.4923V15.8195C35.4158 15.6627 35.3718 15.509 35.2885 15.3761C35.2052 15.2432 35.086 15.1366 34.9447 15.0686C34.8035 15.0006 34.6458 14.9739 34.49 14.9917C34.3342 15.0095 34.1865 15.071 34.0643 15.169Z"
        fill="black"
      />
      <path
        d="M29.6136 8.54688H5.15781C4.87218 8.54688 4.64062 8.7784 4.64062 9.064V29.0782C4.64062 29.3637 4.87218 29.5953 5.15781 29.5953H29.6136C29.8993 29.5953 30.1309 29.3637 30.1309 29.0782V9.064C30.1309 8.7784 29.8993 8.54688 29.6136 8.54688Z"
        fill="#9277AA"
        stroke="black"
        strokeMiterlimit="10"
      />
      <path
        d="M35.6083 25.275L33.467 24.0098C33.0617 23.7703 32.726 23.4294 32.4927 23.0207C32.2595 22.6119 32.1367 22.1494 32.1367 21.6788V17.2277C32.1367 16.8202 32.2287 16.418 32.4058 16.0511C32.5828 15.6841 32.8403 15.3619 33.1592 15.1082L35.5134 13.2357C35.6358 13.1383 35.7832 13.0773 35.9387 13.0599C36.0941 13.0424 36.2514 13.0692 36.3923 13.1371C36.5333 13.2052 36.6522 13.3115 36.7354 13.4439C36.8185 13.5764 36.8626 13.7297 36.8625 13.8862V24.559C36.8626 24.7057 36.8239 24.8497 36.7503 24.9767C36.6767 25.1035 36.5708 25.2086 36.4435 25.2813C36.3161 25.354 36.1717 25.3918 36.025 25.3907C35.8784 25.3896 35.7346 25.3497 35.6083 25.275Z"
        fill="#9277AA"
        stroke="black"
        strokeMiterlimit="10"
      />
      <path
        d="M12.897 20.8364C13.9813 20.8364 14.8603 19.9576 14.8603 18.8733C14.8603 17.789 13.9813 16.9102 12.897 16.9102C11.8126 16.9102 10.9336 17.789 10.9336 18.8733C10.9336 19.9576 11.8126 20.8364 12.897 20.8364Z"
        fill="#F2EE98"
      />
      <path
        d="M21.2953 20.8364C22.3797 20.8364 23.2588 19.9576 23.2588 18.8733C23.2588 17.789 22.3797 16.9102 21.2953 16.9102C20.211 16.9102 19.332 17.789 19.332 18.8733C19.332 19.9576 20.211 20.8364 21.2953 20.8364Z"
        fill="#F2EE98"
      />
    </svg>
  );

  const GiftIcon = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 40 40"
      className={className}
      fill="none"
    >
      <path
        d="M32.4398 11.422H26.5311C26.9115 10.8851 27.0877 10.2299 27.0278 9.5746C26.968 8.91934 26.6761 8.30696 26.2046 7.84783C25.7332 7.38868 25.1133 7.11298 24.4566 7.07038C23.7999 7.02777 23.1496 7.22106 22.6228 7.61544L19.0368 10.2992L16.8679 7.7704C16.6318 7.49513 16.3438 7.26905 16.0204 7.10507C15.6969 6.94109 15.3443 6.84244 14.9827 6.81472C14.6211 6.787 14.2576 6.83077 13.9128 6.94352C13.5682 7.05627 13.2491 7.23582 12.9737 7.47188C12.6985 7.70795 12.4724 7.99591 12.3084 8.31935C12.1444 8.64279 12.0457 8.99535 12.018 9.35693C11.9903 9.71851 12.034 10.0819 12.1469 10.4266C12.2596 10.7713 12.4391 11.0903 12.6752 11.3656L12.7237 11.4226H6.18942C5.90505 11.4226 5.63232 11.5355 5.43123 11.7366C5.23015 11.9377 5.11719 12.2103 5.11719 12.4947V16.6727C5.11734 16.9571 5.23043 17.2298 5.43161 17.4309C5.63278 17.6319 5.90557 17.7448 6.18999 17.7448H6.98192V34.3793C6.98192 34.7768 7.13985 35.158 7.42096 35.4392C7.70206 35.7202 8.08333 35.8781 8.48088 35.8781H30.1511C30.5481 35.8781 30.9288 35.7205 31.2095 35.4398C31.4902 35.1592 31.6479 34.7785 31.6479 34.3816V17.7471H32.4398C32.7242 17.7471 32.997 17.6341 33.1982 17.4331C33.3993 17.2321 33.5124 16.9593 33.5126 16.675V12.497C33.5129 12.3559 33.4854 12.2162 33.4316 12.0858C33.3778 11.9553 33.2989 11.8368 33.1991 11.737C33.0995 11.6371 32.9812 11.5579 32.8509 11.5039C32.7205 11.4499 32.5808 11.422 32.4398 11.422Z"
        fill="black"
      />
      <path
        d="M16.262 4.30992L12.5828 7.46537C12.4411 7.58684 12.4248 7.80011 12.5463 7.94172L19.0091 15.476C19.1306 15.6176 19.3439 15.6339 19.4855 15.5125L23.1648 12.3571C23.3065 12.2356 23.3228 12.0223 23.2013 11.8807L16.7384 4.34641C16.617 4.20479 16.4037 4.18846 16.262 4.30992Z"
        fill="#E687A3"
        stroke="black"
        strokeWidth="1.875"
        strokeMiterlimit="10"
      />
      <path
        d="M29.3902 8.53738L26.4859 4.65692C26.3741 4.50754 26.1624 4.47707 26.013 4.58886L18.0652 10.5362C17.9158 10.648 17.8853 10.8597 17.9971 11.009L20.9013 14.8895C21.0132 15.0389 21.2249 15.0694 21.3743 14.9576L29.3221 9.01026C29.4715 8.89847 29.502 8.68676 29.3902 8.53738Z"
        fill="#E687A3"
        stroke="black"
        strokeWidth="1.875"
        strokeMiterlimit="10"
      />
      <path
        d="M33.0967 14.0435V32.8041C33.0967 33.2009 32.939 33.5816 32.6583 33.8622C32.3776 34.1429 31.9969 34.3006 31.6 34.3006H9.93257C9.53499 34.3006 9.15373 34.1427 8.87263 33.8616C8.59152 33.5806 8.43359 33.1993 8.43359 32.8018V14.0413C8.43359 13.3683 8.70094 12.723 9.17683 12.2471C9.65276 11.7713 10.2982 11.5039 10.9712 11.5039H30.5568C31.2304 11.5039 31.8765 11.7715 32.3528 12.2477C32.8291 12.724 33.0967 13.37 33.0967 14.0435Z"
        fill="#F2EE98"
        stroke="black"
        strokeWidth="1.875"
        strokeMiterlimit="10"
      />
      <path
        d="M33.8851 9.84375H7.6353C7.04281 9.84375 6.5625 10.324 6.5625 10.9165V15.0933C6.5625 15.6858 7.04281 16.1661 7.6353 16.1661H33.8851C34.4776 16.1661 34.9579 15.6858 34.9579 15.0933V10.9165C34.9579 10.324 34.4776 9.84375 33.8851 9.84375Z"
        fill="#F2EE98"
        stroke="black"
        strokeWidth="1.875"
        strokeMiterlimit="10"
      />
      <path
        d="M22.8661 9.84375H18.6523V34.2994H22.8661V9.84375Z"
        fill="#E687A3"
        stroke="black"
        strokeWidth="1.875"
        strokeMiterlimit="10"
      />
    </svg>
  );

  // Format earnings for display (add commas for thousands)
  const formatEarnings = (amount: number) => {
    return amount.toLocaleString('en-US');
  };

  return (
    <div
      className="absolute top-8 lg:top-12 2xl:top-[116px] mx-4 lg:mx-0 lg:right-16 2xl:right-24 
                 bg-white rounded-sm lg:rounded p-3 lg:px-6 lg:py-1 
                 border border-gray-200 lg:w-[332px] flex-shrink-0 z-30"
      style={{ borderRadius: "16px" }}
    >
      {/* Horizontal Layout Container */}
      <div className="flex items-center justify-between gap-3">
        {/* Video Earnings Section */}
        <div className="flex items-center gap-2 flex-1">
          <VideoIcon className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
          <div className="flex items-center">
            <span className="text-xs lg:text-sm font-thin text-[#2D2D2C]">$</span>
            <Input
              placeholder="0.00"
              value={formatEarnings(videoEarnings)}
              readOnly
              numberOnly
              className="placeholder:text-black font-thin border-none outline-none focus:border-none 
                         h-fit p-0 pl-1 text-xs lg:text-sm w-full bg-transparent text-[#2D2D2C]"
            />
          </div>
        </div>

        {/* Vertical Divider */}
        <div
          className="h-8 w-[1px] flex-shrink-0 mr-2"
          style={{
            backgroundColor: "#E687A3",
          }}
        />

        {/* Gift Earnings Section */}
        <div className="flex items-center gap-2 flex-1">
          <GiftIcon className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
          <div className="flex items-center">
            <span className="text-xs lg:text-sm font-thin text-[#2D2D2C]">$</span>
            <Input
              placeholder="0.00"
              value={formatEarnings(giftEarnings)}
              readOnly
              numberOnly
              className="placeholder:text-black font-thin border-none outline-none focus:border-none 
                         h-fit p-0 pl-1 text-xs lg:text-sm-full bg-transparent text-[#2D2D2C]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Earnings;