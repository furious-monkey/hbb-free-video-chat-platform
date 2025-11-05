import WaitListForm from "@/src/components/WaitListForm";

const WaitListPage = () => {
  return (
    <div className="flex justify-center lg:items-center new-blur-bg min-h-screen h-screen pt-8 lg:py-12 px-4 lg:px-0">
      <div className="w-full !h-[80vh] lg:!h-[85vh] lg:px-8 justify-center lg:items-center flex">
        <div className="w-full h-full lg:flex-row flex flex-col lg:overflow-hidden overflow-y-auto bg-pink rounded-2xl bg-green">
          <div className="w-full lg:h-full h-[10vh] hidden xl:w-2/5 2xl:w-1/3 flex-none xl:block relative border-r border-[#E4BEC9] overflow-hidden">
            <img
              src="/assests/dashboard/dashboard-mob.png"
              alt=""
              className="w-full h-full object-cover bg-black lg:hidden"
            />
            <img
              src="/assests/dashboard/dashboard.png"
              alt=""
              className="w-full h-full object-cover bg-black lg:block"
            />
          </div>

          <div className="w-full xl:w-3/5 !2xl:w-1/2 flex-auto bg-pink min-h-0 p-4 lg:p-0 flex items-center justify-center">
            <WaitListForm /> 
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitListPage;
