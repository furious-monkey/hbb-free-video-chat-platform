"use client";

import React, { useEffect, useRef, useState } from "react";
import { genderType } from "@/src/schema/profile/index.data";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "../ui/select";
import { Loader } from "@googlemaps/js-api-loader";

const markersData = [
  {
    name: "America",
    coordinates: [37.7749, -122.4194],
    earnings: "$2789",
  },
  {
    name: "Africa",
    coordinates: [-1.2921, 36.8219],
    earnings: "$4321",
  },
  {
    name: "Asia",
    coordinates: [35.8617, 104.1954],
    earnings: "$7894",
  },
];

const EarningsByRegion = () => {
  const mapRef = useRef<HTMLDivElement>(null);

  const [selectedValue, setSelectedValue] = useState(LocationData[0].value);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY as string,
        version: "weekly",
      });

      const { Map } = await loader.importLibrary("maps");

      const { Marker } = (await loader.importLibrary(
        "marker"
      )) as google.maps.MarkerLibrary;

      const position = {
        lat: 43.642693,
        lng: -79.837189,
      };

      const mapOptions: google.maps.MapOptions = {
        center: position,
        zoom: 2,
        mapId: "HBB_CLIENT_MAP",
      };

      // setup map
      const map = new Map(mapRef.current as HTMLDivElement, mapOptions);

      const marker = new Marker({ map, position });
    };

    initMap();
  }, []);

  return (
    <div className="rounded-20 bg-[#FFFFFF1F] h-[323px] lg:flex-1 py-3 px-3 lg:py-4 lg:px-5">
      <div className="w-full h-full flex flex-col">
        <div className="w-full flex justify-between items-center mb-4">
          <p className="text-sm lg:text-base">Earnings</p>

          <Select onValueChange={(value) => setSelectedValue(value)}>
            <SelectTrigger className="w-[115px] bg-white rounded-lg text-base2 px-3 capitalize text-xs">
              {selectedValue}
            </SelectTrigger>

            <SelectContent className="p-0 min-w-fit border-0">
              <SelectGroup className="w-[115px] border-0 bg-base2">
                {LocationData.map((data) => (
                  <SelectItem
                    key={data.value}
                    value={data.value}
                    showIndicator={false}
                    className="border-0 px-3 py-[6px] text-xs border-white/25 focus:bg-white focus:text-base2 border-b last:border-b-0"
                  >
                    {data.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full h-full flex-1">
          <div ref={mapRef} className="h-full w-full"></div>
        </div>
      </div>
    </div>
  );
};

export default EarningsByRegion;

const LocationData: genderType[] = [
  { value: "region", label: "Region" },
  { value: "country", label: "Country" },
  { value: "state", label: "State" },
];
