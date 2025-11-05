"use client";

import React, { useEffect, useRef } from "react";
// import * as d3 from "d3";
import {
    LineChart,
    Line,
    Legend,
    Tooltip,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts";

const LineCharts = (props: any) => {
    return (
        
            <LineChart
                className="w-full h-auto text-[10px]"
                width={250}
                height={100}
                data={props.data}
                margin={{ top: 10, right: 2, left: 0, bottom: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name"/>
                <YAxis />
            <Line type="monotone" dataKey="pv" stroke="#EFD378" />
            </LineChart>
       
    );
};

export default LineCharts;
