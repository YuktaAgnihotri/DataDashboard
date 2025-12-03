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

    // Group & aggregate
    const grouped: Record<string, Record<string, number[]>> = {};
    data.forEach((row) => {
      const month = getMonth(row.OrderDate);
      const channel = row["Sales Channel"];
      const order = parseDate(row.OrderDate);
      const delivery = parseDate(row.DeliveryDate);
      if (!order || !delivery) return;

      const diff = (delivery.getTime() - order.getTime()) / (1000 * 3600 * 24);
      if (!grouped[month]) grouped[month] = {};
      if (!grouped[month][channel]) grouped[month][channel] = [];
      grouped[month][channel].push(diff);
    });

    const aggregated: AggregatedRow[] = Object.entries(grouped).map(
      ([month, channels]) => {
        const result: AggregatedRow = { month };
        Object.entries(channels).forEach(([ch, arr]) => {
          result[ch] = arr.reduce((a, b) => a + b, 0) / arr.length;
        });
        return result;
      }
    );

    const subgroups = Array.from(new Set(data.map((d) => d["Sales Channel"])));

    const margin = { top: 50, right: 30, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 420 - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
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

    // Tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("z-index", "10")
      .style("background", "white")
      .style("padding", "6px 10px")
      .style("font-size", "12px")
      .style("border-radius", "6px")
      .style("box-shadow", "0px 0px 6px rgba(0,0,0,0.15)")
      .style("display", "none");

    // Draw lines
    subgroups.forEach((channel) => {
      const line = d3
        .line<AggregatedRow>()
        .x((d) => x(d.month)!)
        .y((d) => y((d[channel] as number) || 0))
        .curve(d3.curveMonotoneX);

      svg.append("path")
        .datum(aggregated)
        .attr("fill", "none")
        .attr("stroke", color(channel)!)
        .attr("stroke-width", 3)
        .attr("d", line);

      // Dots
      svg
        .selectAll(`circle-${channel}`)
        .data(aggregated)
        .enter()
        .append("circle")
        .attr("cx", (d) => x(d.month)!)
        .attr("cy", (d) => y((d[channel] as number) || 0))
        .attr("r", 6)
        .attr("fill", color(channel)!)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
          tooltip.style("display", "block")
            .html(`<b>${channel}</b><br/>${d.month}: ${d[channel]} days`);
          d3.select(this).attr("r", 9);
        })
        .on("mousemove", (event) => {
          tooltip.style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 20 + "px");
        })
        .on("mouseout", function () {
          tooltip.style("display", "none");
          d3.select(this).attr("r", 6);
        });
    });

    // Axes
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    svg.append("g").call(d3.axisLeft(y));

    // Legend
    const legend = svg.append("g").attr("transform", `translate(0,-30)`);
    subgroups.forEach((ch, i) => {
      const g = legend.append("g").attr("transform", `translate(${i * 140},0)`);
      g.append("rect").attr("width", 15).attr("height", 15).attr("fill", color(ch)!);
      g.append("text").attr("x", 22).attr("y", 12).text(ch).style("font-size", "13px");
    });

  }, [data]);

  return (
    <>
      <h2 className="text-xl font-bold mb-3">Delivery Duration Trend Across Channels</h2>
      <svg ref={svgRef} style={{ width: "100%", height: "auto" }}></svg>
    </>
  );
}
