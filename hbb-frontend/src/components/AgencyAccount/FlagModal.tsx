import { X } from "lucide-react";
import React from "react";
import { Checkbox } from "../ui/checkbox";

interface Props {
  setOpenFlagData: React.Dispatch<React.SetStateAction<boolean>>;
}

const FlagModal = ({ setOpenFlagData }: Props) => {
  return (
    <div className="fixed top-0 left-0 z-20 w-full h-full backdrop-blur-sm bg-black/55">
      <div className="w-full h-full flex items-center justify-center px-4 py-20">
        <div className="bg-base1 w-full lg:max-w-[955px] h-full lg:max-h-[556px] p-4 rounded-xl overflow-hidden">
          <div className="w-full h-full flex flex-col">
            <div>
              <div className="w-full flex justify-end">
                <X
                  className="w-8 h-8 cursor-pointer bg-white rounded-[10px]"
                  color="#292D32"
                  size={18}
                  onClick={() => setOpenFlagData(false)}
                />
              </div>

              <p className="font-medium text-2xl pb-3">Flags</p>
            </div>

            <div className="flex-1 w-full overflow-y-auto  mt-4">
              <div className="w-full h-full">
                {["1", "2"].map((dta) => (
                  <div
                    key={dta}
                    className="mb-3 pt-3 border-t border-[#8FC0D3]"
                  >
                    <p className="font-medium text-sm text-center text-white/50 mb-[6px]">
                      02 - 14 -2024
                    </p>

                    <div className="space-y-3">
                      {["1", "2"].map((conduct) => (
                        <div key={conduct}>
                          <p className="font-medium text-sm text-center text-white/50">
                            14:57 pm
                          </p>

                          <div className="w-full flex flex-col lg:flex-row mt-2">
                            <div className="lg:flex-1">
                              <div className="w-full flex lg:flex-col lg:justify-normal lg:gap-8 gap-3 flex-wrap mb-6 lg:mb-0">
                                {checkedData.map((data) => (
                                  <div
                                    key={data.action}
                                    className="flex items-center gap-3 w-[45%] lg:w-full"
                                  >
                                    <Checkbox
                                      checked={data.checked}
                                      className="2xl:h-5 2xl:w-5 border-[#C0C0C0] data-[state=checked]:bg-base2 data-[state=checked]:border-none data-[state=checked]:text-white rounded-full"
                                    />

                                    <p
                                      className={`font-medium text-sm ${
                                        data.checked
                                          ? "text-white"
                                          : "text-[#C0C0C0]"
                                      }`}
                                    >
                                      {data.action}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="lg:flex-[2] w-full h-60 rounded-lg bg-white/25 p-3">
                              <p className="font-medium">No Comment</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlagModal;

const checkedData = [
  {
    action: "Catfishing",
    checked: true,
  },
  {
    action: "Misconduct",
    checked: false,
  },
  {
    action: "Harassement",
    checked: false,
  },
  {
    action: "Illegal activity",
    checked: false,
  },
  {
    action: "Other",
    checked: false,
  },
];
