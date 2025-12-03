"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface Row {
  orderNumber: string;
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

export default function DeliveryGroupedBar({ data }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    const parseDate = d3.timeParse("%d/%m/%Y");

    const getMonth = (dateStr: string) => {
      const parsed = parseDate(dateStr);
      return parsed ? d3.timeFormat("%b")(parsed) : "";
    };

    // Group and aggregate delivery duration
    const grouped: Record<string, Record<string, number[]>> = {};

    data.forEach((row) => {
      const month = getMonth(row.OrderDate);
      const channel = row["Sales Channel"];

      const order = parseDate(row.OrderDate);
      const delivery = parseDate(row.DeliveryDate);
      if (!order || !delivery) return;

      const diffDays =
        (delivery.getTime() - order.getTime()) / (1000 * 3600 * 24);

      if (!grouped[month]) grouped[month] = {};
      if (!grouped[month][channel]) grouped[month][channel] = [];

      grouped[month][channel].push(diffDays);
    });

    const aggregated: AggregatedRow[] = Object.entries(grouped).map(
      ([month, channels]) => {
        const result: AggregatedRow = { month };
        Object.entries(channels).forEach(([channel, arr]) => {
          result[channel] = arr.reduce((a, b) => a + b, 0) / arr.length;
        });
        return result;
      }
    );

    const subgroups: string[] = Array.from(
      new Set(data.map((d) => d["Sales Channel"]))
    );

    const margin = { top: 50, right: 20, bottom: 60, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr(
        "viewBox",
        `0 0 ${width + margin.left + margin.right} ${
          height + margin.top + margin.bottom
        }`
      )
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const groups = aggregated.map((d) => d.month);

    const x0 = d3.scaleBand().domain(groups).range([0, width]).padding(0.25);

    const x1 = d3
      .scaleBand()
      .domain(subgroups)
      .range([0, x0.bandwidth()])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(aggregated, (d) =>
          d3.max(subgroups, (key) => (d[key] as number) || 0)
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
      .style("font-size", "13px")
      .style("border-radius", "6px")
      .style("box-shadow", "0px 2px 6px rgba(0,0,0,0.2)")
      .style("display", "none");

    // Draw bars
    svg
      .append("g")
      .selectAll("g")
      .data(aggregated)
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${x0(d.month) ?? 0},0)`)
      .selectAll("rect")
      .data((d) =>
        subgroups.map((key) => ({
          key,
          value: (d[key] as number) || 0,
        }))
      )
      .enter()
      .append("rect")
      .attr("x", (d) => x1(d.key) ?? 0)
      .attr("y", height)
      .attr("width", x1.bandwidth())
      .attr("height", 0)
      .attr("fill", (d) => color(d.key)!)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        tooltip.style("display", "block").html(
          `<b>${d.key}</b><br/>Delivery Days: <b>${d.value.toFixed(1)}</b>`
        );
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill", "#0ea5e9")
          .attr("opacity", 0.9)
          .style("filter", "drop-shadow(0px 0px 6px #555)");
      })
      .on("mousemove", (event) =>
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 20 + "px")
      )
      .on("mouseout", function () {
        tooltip.style("display", "none");
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill", (d:any) => color(d.key)!)
          .attr("opacity", 1)
          .style("filter", "none");
      })
      .transition()
      .ease(d3.easeCubicInOut)
      .duration(1200)
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => height - y(d.value));

    // Axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0));

    svg.append("g").call(d3.axisLeft(y));

    // Legend
    const legend = svg.append("g").attr("transform", `translate(0,-30)`);

    subgroups.forEach((ch, i) => {
      const g = legend.append("g").attr("transform", `translate(${i * 140},0)`);
      g.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", color(ch)!);
      g.append("text")
        .attr("x", 22)
        .attr("y", 12)
        .text(ch)
        .style("font-size", "14px");
    });
  }, [data]);

  return (
    <>
      <h2 className="text-xl font-semibold mb-3">
        Avg Delivery Days per Month by Sales Channel
      </h2>
      <svg ref={svgRef} style={{ width: "100%", height: "auto" }}></svg>
    </>
  );
}
