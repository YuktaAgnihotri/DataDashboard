"use client";



{/*export default function Piechart(data:any){
    console.log("Piechart data:", data);
    return(<>
        <h1> piee</h1>
       
        </>)
}*/}


import { useEffect, useRef } from "react";
import { select } from "d3-selection";
import { pie, arc } from "d3-shape";
import * as d3 from "d3";
interface Row {
  ["Sales Channel"]: string;
}

interface Props {
data: Row[];

}

export default function PieChart({ data }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
console.log("Piechart data:", data.length);

  const aggregated = Object.values(
    data.reduce((acc: any, row: Row) => {
      const channel = row["Sales Channel"];
      acc[channel] = acc[channel] || { name: channel, value: 0 };
      acc[channel].value++;
      return acc;
    }, {})
  );

  console.log("Aggregated:", aggregated);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 400;
    const height = 300;

    const svg = select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

        svg.selectAll("*").remove(); // Clear old chart
    const radius = Math.min(width, height) / 2;

    const pieGen = pie<any>().value(d => d.value)(aggregated);
    const arcGen = arc().innerRadius(0).outerRadius(radius);

    const colors = ["#4ade80", "#22c55e", "#16a34a", "#0f766e", "#06b6d4"];


     const total = aggregated.reduce((sum: number, d: any) => sum + d.value, 0);

    // Create tooltip div
    const tooltip = select("body")
      .append("div")
      .style("position", "absolute")
      .style("padding", "6px 10px")
      .style("background", "rgba(0,0,0,0.75)")
      .style("color", "white")
      .style("border-radius", "8px")
      .style("pointer-events", "none")
      .style("font-size", "14px")
      .style("visibility", "hidden");
     
    svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`)
      .selectAll("path")
      .data(pieGen)
      .enter()
      .append("path")
      .attr("d", arcGen as any)
      .attr("fill", (_, i) => colors[i % colors.length])
      .on("mouseover", function (this: SVGPathElement, event: any, d: any) {
        const percent = ((d.data.value / total) * 100).toFixed(2);
        tooltip
          .style("visibility", "visible")
          .text(`${d.data.name}: ${d.data.value} orders (${percent}%)`);
        select(this).style("opacity", 0.7);
      })
      .on("mousemove", function (this: SVGPathElement, event: any) {
        tooltip
          .style("top", event.pageY - 40 + "px")
          .style("left", event.pageX + 20 + "px");
      })
      .on("mouseout", function (this: SVGPathElement) {
        tooltip.style("visibility", "hidden");
        select(this).style("opacity", 1);
      })
       .transition()
  .duration(1200)
  .ease(d3.easeCubic)
  .attrTween("d", function (d: any) {
    const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
    return function (t) {
      return arcGen(i(t)) as string;
    };
  });
  }, [data]);

  return(
    <div>
        <h2 className="text-xl font-semibold mb-2">Sales by Channel : hover</h2>
       <svg ref={svgRef}></svg>
    </div>
  ) 
}
