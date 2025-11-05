import { MapPin, X } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";

interface Props {
  setOpenProfile: React.Dispatch<React.SetStateAction<boolean>>;
}

const ProfileModal = ({ setOpenProfile }: Props) => {
  return (
    <div className="fixed top-0 left-0 z-20 w-full h-full backdrop-blur-sm bg-black/55">
      <div className="w-full h-full flex items-center justify-center  px-4 py-16">
        {/* mobile */}
        <div className="bg-base1 w-full h-full p-4 rounded-xl lg:hidden">
          <div className="w-full flex justify-end mb-2">
            <X
              className="w-5 h-5 cursor-pointer"
              color="#292D32"
              size={18}
              onClick={() => setOpenProfile(false)}
            />
          </div>

          <div className="w-full bg-white h-36 rounded-xl"></div>

          <div className="py-3 border-y border-[#8FC0D3] flex items-center justify-between">
            <p className="font-medium text-xl leading-tight">
              Sassy L, <span className="font-light">24</span>
            </p>
            <p className="font-light text-xs flex items-center gap-2">
              <MapPin className="w-3 h-4 text-base2" />
              Washington D.C
            </p>
          </div>

          <div className="py-3 border-b border-[#8FC0D3]">
            <div className="px-[10px] py-2 lg:py-[10px] rounded-full flex items-center bg-tertiary w-fit h-fit gap-2">
              <p className="text-xs">♒️</p>
              <p className="font-light text-xs text-black">Aquarius</p>
            </div>

            <div className="text-xs mt-3">My interest</div>

            <div className="mt-[10px] flex items-center gap-2">
              {["Writing", "Walking dogs", "Whisky"].map((itrst) => (
                <div
                  key={itrst}
                  className="px-[10px] py-2 lg:py-[10px] rounded-full flex items-center bg-base2 w-fit h-fit gap-2"
                >
                  <p className="text-xs">♒️</p>
                  <p className="font-light text-xs">{itrst}</p>
                </div>
              ))}
            </div>

            <div className="text-xs mt-3">Bio</div>

            <div className="text-xs mt-3">
              Lorem ipsum dolor sit, amet consectetur adipisicing elit. Maxime,
              at!
            </div>
          </div>

          <div className="py-3 border-b border-[#8FC0D3]">
            <div>Request call</div>

            <div className="text-xs mt-3">Current rate</div>

            <div className="h-12 w-40 rounded-md bg-[#806996] flex items-center px-[14px] mt-2">
              <p className="text-sm">$25.00</p>
            </div>
          </div>

          <div className="flex items-center gap-3 py-3">
            <Button
              className={`w-fit h-fit px-4 py-[10px] rounded-full font-medium text-sm shadow-[2px_2px_0px_2px_#000000] bg-base2 hover:bg-base2/80 text-black`}
            >
              Suspend account
            </Button>

            <span className="w-[1px] h-9 bg-[#8FC0D3]" />

            <Button
              className={`w-fit h-fit px-4 py-[10px] rounded-full font-medium text-sm border border-white text-white bg-transparent`}
            >
              Report
            </Button>
          </div>
        </div>

        {/* web */}
        <div className="bg-base1 w-full max-w-[955px] h-full max-h-[556px] p-4 rounded-xl lg:block hidden">
          <div className="w-full h-full flex gap-4">
            <div className="flex-[1.5] bg-white h-full rounded-xl"></div>

            <div className="flex-1 h-full">
              <div className="h-full w-full px-4 border-l border-[#8FC0D3]">
                <div className="w-full flex flex-col items-end">
                  <X
                    className="w-5 h-5 cursor-pointer mb-4"
                    color="#292D32"
                    size={18}
                    onClick={() => setOpenProfile(false)}
                  />

                  <div className="flex items-center gap-3 pb-3">
                    <Button
                      className={`w-fit h-fit px-4 py-[10px] rounded-full font-medium text-sm shadow-[2px_2px_0px_2px_#000000] bg-base2 hover:bg-base2/80 text-black`}
                    >
                      Suspend account
                    </Button>

                    <span className="w-[1px] h-9 bg-[#8FC0D3]" />

                    <Button
                      className={`w-fit h-fit px-4 py-[10px] rounded-full font-medium text-sm border border-white text-white bg-transparent`}
                    >
                      Report
                    </Button>
                  </div>
                </div>

                <div className="py-3 border-y border-[#8FC0D3]">
                  <p className="font-medium text-32px leading-tight">
                    Sassy L, <span className="font-light">24</span>
                  </p>
                  <p className="font-light text-xs flex items-center gap-2">
                    <MapPin className="w-3 h-4 text-base2" />
                    Washington D.C
                  </p>
                </div>

                <div className="py-3 border-b border-[#8FC0D3]">
                  <div className="p-[10px] rounded-full flex items-center bg-tertiary w-fit h-fit gap-2">
                    <p className="text-xs">♒️</p>
                    <p className="font-light text-xs text-black">Aquarius</p>
                  </div>

                  <div className="text-xs mt-3">My interest</div>

                  <div className="mt-[10px] flex items-center gap-2">
                    {["Writing", "Walking dogs", "Whisky"].map((itrst) => (
                      <div
                        key={itrst}
                        className="p-[10px] rounded-full flex items-center bg-base2 w-fit h-fit gap-2"
                      >
                        <p className="text-xs">♒️</p>
                        <p className="font-light text-xs">{itrst}</p>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs mt-3">Bio</div>

                  <div className="text-xs mt-3">
                    Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                    Maxime, at!
                  </div>
                </div>

                <div className="py-3">
                  <div>Request call</div>

                  <div className="text-xs mt-3">Current rate</div>

                  <div className="h-12 w-40 rounded-md bg-[#806996] flex items-center px-[14px] mt-2">
                    <p className="text-sm">$25.00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
