"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Piechart from "./piechart";
import Bargraph from "./bargraph";
import Linegraph from "./linegraph";

export default function DashboardClient() {
  const [type, setType] = useState<string>("bargraph");

  return (
    <div className="w-full">
      {/* Navbar always visible */}
      <Navbar type={type} setType={setType} />

      <div className="p-6">
        {type === "bargraph" && <Bargraph />}
        {type === "piechart" && <Piechart />}
        {type === "linegraph" && <Linegraph />}
      </div>
    </div>
  );
}
