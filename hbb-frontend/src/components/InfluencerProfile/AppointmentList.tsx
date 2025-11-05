import React from "react";
import { UserAppointmentsInterface } from "@/src/utils/interface";
import Image from "next/image";
import { TfiLocationPin } from "react-icons/tfi";
import CountdownTimer from "../app-reusables/CountdownTimer";
import { formatMonthDay } from "@/src/utils/functions";
import EmptyState from "../app-reusables/EmptyState";
import { usePathname } from "next/navigation";

interface AppointmentsListProps {
  appointments: UserAppointmentsInterface[] | undefined;
}

const AppointmentsList: React.FC<AppointmentsListProps> = ({
  appointments,
}) => {
  const pathname = usePathname();

  const segment = pathname.split("/")[2];
  return (
    <div
      className={`overflow-hidden bg-neutral-200 bg-opacity-15 rounded-2xl p-5 w-full md:w-full m-[auto] md:p-5 mb-2 flex flex-col h-[298px] md:h-[58vh] ${
        segment == "explorer" && "min-h-[600px]"
      } overflow-y-auto`}
    >
      <p className="text-xl font-light">
        {`Appointments ${appointments?.length || 0}`}
      </p>
      {appointments && appointments.length > 0 ? (
        appointments.map((appointment, idx) => (
          <div key={idx} className="flex flex-col mt-3">
            <div className="flex flex-row w-full rounded-2xl h-[120px]">
              <div className="hidden  md:flex md:flex-col md:w-[20%] md:h-[120px] md:bg-[#6AB5D2] md:rounded-tl-lg md:rounded-bl-lg md:text-center ">
                {appointment?.date ? (
                  <>
                    <p className="text-[20px] mt-[30%]">
                      {formatMonthDay(appointment?.date).split(" ")[0]}
                    </p>
                    <p className="text-[20px]">
                      {formatMonthDay(appointment?.date).split(" ")[1]}
                    </p>
                  </>
                ) : null}
              </div>
              <div className="w-full md:w-[80%] flex flex-row items-center rounded-tr-lg rounded-br-lg bg-neutral-200 bg-opacity-15">
                <div className="w-full">
                  <div className="hidden md:flex md:flex-row md:w-[90%] items-center md:mx-[auto]">
                    <Image
                      src="/img/hbb_user_logo.png"
                      alt="Caller"
                      width={100}
                      height={100}
                      className="w-4 h-4 lg:w-[40px] lg:h-[40px] rounded-full"
                    />
                    <div className="flex flex-col ml-2">
                      <p className="text-[18px] leading-none mb-1">
                        {appointment?.caller
                          ? `${appointment?.caller?.lastName} ${appointment?.caller?.firstName}`
                          : null}
                      </p>
                      <p className="flex flex-row">
                        <TfiLocationPin color="ffffff" className="mr-1" />
                        <p className="text-xs">
                          {appointment?.caller
                            ? appointment?.caller?.profile?.location
                            : null}
                        </p>
                      </p>
                    </div>
                  </div>
                  <div className="md:hidden  flex flex-row p-1 justify-between border-b border-[#ffffff] mx-[auto] w-[90%]">
                    <div className="flex flex-row p-1 ">
                      <Image
                        src="/assests/camera.svg"
                        alt="Caller"
                        width={52}
                        height={52}
                        className="w-8 h-12 rounded-full"
                      />
                      <div className="flex flex-col ml-3">
                        <p className="text-[18px]">
                          {appointment?.caller
                            ? `${appointment?.caller?.lastName} ${appointment?.caller?.firstName}`
                            : null}
                        </p>
                        <p className="flex flex-row">
                          <TfiLocationPin color="ffffff" className="mr-1" />
                          <p className="text-xs">
                            {appointment?.caller
                              ? appointment?.caller?.profile?.location
                              : null}
                          </p>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row justify-between pl-2 pt-1 rounded-lg text-[11px] bg-[#6AB5D2] text-[#ffffff] w-[50px] h-[32px] text-center">
                      <p className="text-xs mt-1">
                        {appointment?.date
                          ? formatMonthDay(appointment.date)
                          : null}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-between pt-1 w-[90%] mx-[auto] mt-4 ">
                    <CountdownTimer targetDate={new Date(appointment?.date)} />
                    {appointment?.status === "ACCEPTED" && (
                      <div className="flex flex-row items-center justify-center px-2 py-1 rounded-lg text-[11px] bg-[#4EB246] text-[#ffffff] w-[110px] h-[32px] text-center">
                        <p className="text-xs leading-none">Connect to call</p>
                      </div>
                    )}
                    {appointment?.status === "CANCELLED" && (
                      <p className="text-[14px] text-[#EB5656] leading-none">
                        Cancel schedule
                      </p>
                    )}
                    {appointment?.status === "PENDING" && (
                      <p className="text-[14px] text-[#EB5656]">
                        Cancel schedule
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="mt-4 h-full">
          <div className="bg-[#ECA3B8] w-full h-full rounded-xl flex justify-center items-center py-20">
            <div className="w-max h-max">
              <Image
                src={"/icons/appointments.svg"}
                alt="no appointments"
                width={300}
                height={300}
                className={`mx-auto w-[80px] h-[80px] ${segment == "explorer" ? "lg:w-[141px] lg:h-[141px]": ""}`}
              />
              <h3 className={`text-center font-light mt-4  ${segment == "explorer" ? "lg:text-[24px]": "lg:text-[20px]"}`}>
                No appointments yet.
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsList;
