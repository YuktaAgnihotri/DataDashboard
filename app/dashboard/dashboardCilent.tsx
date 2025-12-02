"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Piechart from "./piechart";
import Bargraph from "./bargraph";
import Linegraph from "./linegraph";

interface DashboardProps {
  data: any;
}

export default function DashboardClient({data} : DashboardProps) {
  const [type, setType] = useState<string>("bargraph");
   




  return (
    <div className="w-full h-screen bg-neutral-400">
      {/* Navbar always visible */}
      <Navbar type={type} setType={setType} />

      <div className="p-6">
        {type === "bargraph" && <Bargraph data={data}/>}
        {type === "piechart" && <Piechart data={data} />}
        {type === "linegraph" && <Linegraph data={data} />}
      </div>
    </div>
  );
}
