"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import L, { LatLngTuple } from "leaflet";
import { Circle, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { genderType } from "@/src/schema/profile/index.data";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "../ui/select";

const customIcon = new L.Icon({
  iconUrl: "/assests/marker.svg",
  iconSize: [23, 23],
});

type MarkerData = {
  name: string;
  coordinates: LatLngTuple;
  earnings: string;
};

const markers: MarkerData[] = [
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
  const [selectedValue, setSelectedValue] = useState(LocationData[0].value);

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
          <MapContainer center={[20, 0]} zoom={2} className="w-full h-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {markers.map(({ name, coordinates, earnings }) => (
              <Marker key={name} position={coordinates} icon={customIcon}>
                <Popup>
                  <div>
                    <strong>{name}</strong>
                    <br />
                    Earnings: {earnings}
                  </div>
                </Popup>
                <Circle
                  center={coordinates}
                  fillColor="blue"
                  radius={200000}
                  stroke={false}
                  opacity={0.5}
                />
              </Marker>
            ))}
          </MapContainer>
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
