// dashboard/influencer/live/AllowBidsToggle.tsx
"use client";

import { useState } from "react";
import { Switch } from "@/src/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Info } from "lucide-react";
import { useUserStore } from "@/src/store/userStore";

const AllowBidsToggle = () => {
  const { allowBids, setAllowBids } = useUserStore((state: any) => ({
    allowBids: state.allowBids,
    setAllowBids: state.setAllowBids,
  }));
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="flex items-center bg-pink text-white px-5 py-3 rounded-lg gap-2">
      <span className="text-sm">Allow Bids </span>
      <button onClick={() => setIsDialogOpen(true)}>
        <Info size={16} className="opacity-80" />
      </button>
      <Switch 
        checked={allowBids} 
        onCheckedChange={(checked) => setAllowBids(checked)}
      />      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="md:py-6 md:px-10 text-center md:max-w-md md:mx-auto md:w-full w-[53vh] rounded-lg bg-black/60 border-none flex flex-col items-center backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-center mt-7">Allow Bids</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            This process will give other Explorers the opportunity to place competitive bids to join the call.
            At the same time, the current Explorer on the call will have the chance to submit a counter bid in an effort to retain their spot.
            When the highest bid is reached, the Explorer with that winning bid will remain on the call, replacing the previous participant.
            This dynamic system ensures that the most competitive bids determine who gets to be part of the call at any given time.
          </p>
          <Button className="bg-white rounded-full text-black mt-5 md:w-[75%] w-full h-10 text-sm" onClick={() => setIsDialogOpen(false)}>Ok got it!</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllowBidsToggle;