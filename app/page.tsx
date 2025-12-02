import Image from "next/image";
import Link from "next/link";
export default function Home() {
  return (
    <div className=" h-screen flex justify-center  items-center">
    <h1> See large dataset converted to comprehensive graphs and charts </h1>
    
    <div>
       <button className="bg-black text-white p-4 m-4 rounded-2xl"> <Link href= "/dashboard"> Dashboard </Link></button>
    </div>
    
    </div>
  );
}
