"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface Row {
  ["Sales Channel"]: string;
  OrderDate: string;
  DeliveryDate: string;
}

interface AggregatedRow {
  month: string;
  [key: string]: number | string;
}

interface Props {
  data: Row[];
}

export default function DeliveryLineChart({ data }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current || !wrapperRef.current)
      return;

    const drawChart = () => {
      const containerWidth = wrapperRef.current!.clientWidth;
      const margin = { top: 40, right: 20, bottom: 45, left: 50 };
      const width = containerWidth - margin.left - margin.right;
      const height = 380 - margin.top - margin.bottom;

      const parseDate = d3.timeParse("%d/%m/%Y");
      const getMonth = (dateStr: string): string => {
        const parsed = parseDate(dateStr);
        return parsed ? d3.timeFormat("%b")(parsed) : "";
      };

      const grouped: Record<string, Record<string, number[]>> = {};

      data.forEach((row) => {
        const month = getMonth(row.OrderDate);
        const channel = row["Sales Channel"].trim();
        const order = parseDate(row.OrderDate);
        const delivery = parseDate(row.DeliveryDate);
        if (!order || !delivery) return;

        const diffDays =
          (delivery.getTime() - order.getTime()) / (1000 * 60 * 60 * 24);

        if (!grouped[month]) grouped[month] = {};
        if (!grouped[month][channel]) grouped[month][channel] = [];
        grouped[month][channel].push(diffDays);
      });

      const aggregated: AggregatedRow[] = Object.entries(grouped).map(
        ([month, channels]) => {
          const obj: AggregatedRow = { month };
          Object.entries(channels).forEach(([ch, arr]) => {
            obj[ch] = arr.reduce((a, b) => a + b, 0) / arr.length;
          });
          return obj;
        }
      );

      const subgroups = Array.from(new Set(data.map((d) => d["Sales Channel"].trim())));

      d3.select(svgRef.current).selectAll("*").remove();

      const svg = d3
        .select(svgRef.current)
        .attr("width", containerWidth)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3
        .scalePoint()
        .domain(aggregated.map((d) => d.month))
        .range([0, width])
        .padding(0.5);

      const y = d3
        .scaleLinear()
        .domain([
          0,
          d3.max(aggregated, (d) =>
            d3.max(subgroups, (k) => (d[k] as number) || 0)
          ) || 0,
        ])
        .nice()
        .range([height, 0]);

      const color = d3
        .scaleOrdinal<string>()
        .domain(subgroups)
        .range(["#3b82f6", "#22c55e", "#f97316"]);

      // Draw lines
      subgroups.forEach((channel) => {
        const line = d3
          .line<AggregatedRow>()
          .x((d) => x(d.month)!)
          .y((d) => y((d[channel] as number) || 0))
          .curve(d3.curveMonotoneX);

        const path = svg
          .append("path")
          .datum(aggregated)
          .attr("fill", "none")
          .attr("stroke", color(channel)!)
          .attr("stroke-width", 3)
          .attr("d", line);

        const totalLength = (path.node() as SVGPathElement).getTotalLength();
        path
          .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
          .attr("stroke-dashoffset", totalLength)
          .transition()
          .duration(2000)
          .ease(d3.easeCubic)
          .attr("stroke-dashoffset", 0);

        // Dots
        svg
          .selectAll(`circle-${channel}`)
          .data(aggregated)
          .enter()
          .append("circle")
          .attr("cx", (d) => x(d.month)!)
          .attr("cy", (d) => y((d[channel] as number) || 0))
          .attr("r", containerWidth < 500 ? 3 : 5)
          .attr("fill", color(channel)!);
      });

      svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

      svg.append("g").call(d3.axisLeft(y));
    };

    drawChart();

    // Resize listener
    const resizeObserver = new ResizeObserver(() => drawChart());
    resizeObserver.observe(wrapperRef.current);

    return () => resizeObserver.disconnect();
  }, [data]);

  return (
    <>
      <h2 className="text-xl font-bold mb-3">
        Delivery Duration Trend Across Channels
      </h2>
      <div ref={wrapperRef} style={{ width: "100%" }}>
        <svg ref={svgRef}></svg>
      </div>
    </>
  );
}
