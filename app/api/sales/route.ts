export const runtime = "nodejs";


import { NextResponse } from "next/server";

import fs from "fs/promises";
import path from "path";
import Papa from "papaparse";
 // or "nodejs" – both okay

export async function GET() {
  try {
    console.log("📌 API called");

    const filePath = path.join(process.cwd(), "public", "kaggledata-set", "USsales.csv");

    const fileData = await fs.readFile(filePath, "utf8");

    const parsed = Papa.parse(fileData, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });


    return NextResponse.json(parsed.data);


    
  } catch (err: any) {
    console.error("❌ API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}



{/*
export async function GET() {
  try {
    const base = process.env.NEXT_PUBLIC_URL;
    if (!base) {
      return new Response("Missing NEXT_PUBLIC_URL", { status: 500 });
    }

    const csvUrl = `${base.replace(/\/$/, "")}/kaggle-dataset/avocado.csv`;

    return new Response(
      `API Loaded\nBase: ${base}\nCSV URL: ${csvUrl}\nNow fetching...`
    );
  } catch (e: any) {
    return new Response("ERROR: " + e.message, { status: 500 });
  }
}
*/}