'use client';

interface Props {
  type: string;
  setType: React.Dispatch<React.SetStateAction<string>>;
}

import { useState } from "react"

export default function Navbar({ type, setType }: Props){
   
    return(<>
        <h1 className="text-center text-4xl font-extrabold mb-10">US sales for different channels</h1>
          <button className="m-4 p-3 bg-black text-white rounded-2xl" 
          onClick={()=>setType('bargraph')}> Bargraph</button>
          <button className="m-4 p-3 bg-black text-white rounded-2xl" 
          onClick={()=>setType('piechart')}> piechart</button>
          <button className="m-4 p-3 bg-black text-white rounded-2xl" 
           onClick={()=>setType('linegraph')}> linegraph</button>

  
        </>)
}