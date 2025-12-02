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

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    const parseDate = d3.timeParse("%d/%m/%Y");
    const getMonth = (dateStr: string): string => {
      const parsed = parseDate(dateStr);
      return parsed ? d3.timeFormat("%b")(parsed) : "";
    };

    // Group by month → sales channel
    const grouped: Record<string, Record<string, number[]>> = {};

    data.forEach((row) => {
      const month = getMonth(row.OrderDate);
      const channel = row["Sales Channel"];
      const order = parseDate(row.OrderDate);
      const delivery = parseDate(row.DeliveryDate);

      if (!order || !delivery) return;

      const diffDays =
        (delivery.getTime() - order.getTime()) / (1000 * 60 * 60 * 24);

      if (!grouped[month]) grouped[month] = {};
      if (!grouped[month][channel]) grouped[month][channel] = [];
      grouped[month][channel].push(diffDays);
    });

    // Aggregate monthly averages
    const aggregated: AggregatedRow[] = Object.entries(grouped).map(
      ([month, channels]) => {
        const result: AggregatedRow = { month };
        Object.entries(channels).forEach(([channel, arr]) => {
          result[channel] = arr.reduce((a, b) => a + b, 0) / arr.length;
        });
        return result;
      }
    );

    const subgroups = Array.from(
      new Set(data.map((d) => d["Sales Channel"]))
    );

    // Setup
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 420 - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
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
      .domain([0, d3.max(aggregated, (d) =>
        d3.max(subgroups, (k) => (d[k] as number) || 0)
      ) || 0])
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

      svg
        .append("path")
        .datum(aggregated)
        .attr("fill", "none")
        .attr("stroke", color(channel)!)
        .attr("stroke-width", 3)
        .attr("d", line);

      // Add dots
      svg
        .selectAll(`circle-${channel}`)
        .data(aggregated)
        .enter()
        .append("circle")
        .attr("cx", (d) => x(d.month)!)
        .attr("cy", (d) => y((d[channel] as number) || 0))
        .attr("r", 5)
        .attr("fill", color(channel)!);
    });

    // Axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append("g").call(d3.axisLeft(y));

    svg
      .append("text")
      .text("Months")
      .attr("x", width / 2)
      .attr("y", height + 40);

    svg
      .append("text")
      .text("Delivery Days")
      .attr("x", -height / 2)
      .attr("y", -40)
      .attr("transform", "rotate(-90)");

  }, [data]);

  return (
    <>
      <h2 className="text-xl font-bold mb-3">
        Delivery Duration Trend Across Channels
      </h2>
      <svg ref={svgRef} />
    </>
  );
}
