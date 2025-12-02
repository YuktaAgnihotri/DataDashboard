"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface Row {
  orderNumber: string;
  ["Sales Channel"]: string;
  WarehouseCode: string;
  ProcuredDate: string;
  OrderDate: string;
  ShipDate: string;
  DeliveryDate: string;
  CurrencyCode: string;
  _SalesTeamID: string;
  _CustomerID: string;
  _StoreID: string;
  _ProductID: string;
  ["Order Quantity"]: number;
  ["Discount Applied"]: number;
  ["Unit Cost"]: number;
  ["Unit Price"]: number;
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

    // Parse DD/MM/YYYY and extract month
    const parseDate = d3.timeParse("%d/%m/%Y");
    const getMonth = (dateStr: string): string => {
      const parsed = parseDate(dateStr);
      return parsed ? d3.timeFormat("%b")(parsed) : "";
    };

    // Group data
    const grouped: Record<string, Record<string, number[]>> = {};

    data.forEach((row) => {
      const month = getMonth(row.OrderDate);
      const channel = row["Sales Channel"];

      const orderDate = parseDate(row.OrderDate);
      const deliveryDate = parseDate(row.DeliveryDate);

      if (!orderDate || !deliveryDate) return;

      const diffDays =
        (deliveryDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);

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

    // Create chart
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select<SVGSVGElement, unknown>(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const subgroups: string[] = Array.from(
      new Set(data.map((d) => d["Sales Channel"]))
    ); // e.g. ["Wholesale", "Instore", "Warehouse"]

    const groups = aggregated.map((d) => d.month);

    const x0 = d3
      .scaleBand()
      .domain(groups)
      .range([0, width])
      .padding(0.2);

    const x1 = d3
      .scaleBand()
      .domain(subgroups)
      .range([0, x0.bandwidth()])
      .padding(0.05);

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
      .attr("y", (d) => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", (d) => height - y(d.value))
      .attr("fill", (d) => color(d.key) as string);

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0));

    svg.append("g").call(d3.axisLeft(y));

    // Legend
    const legend = svg.append("g").attr("transform", `translate(0,-20)`);

    subgroups.forEach((ch, i) => {
      const g = legend
        .append("g")
        .attr("transform", `translate(${i * 120},0)`);

      g.append("rect").attr("width", 15).attr("height", 15).attr("fill", color(ch) as string);

      g.append("text").attr("x", 20).attr("y", 12).text(ch);
    });
  }, [data]);

  return (
    <>
     <div>
      <h2 className="text-xl font-semibold mb-3">
        Avg Delivery Days per Month by Sales Channel
      </h2>
      <svg ref={svgRef}></svg>
    </div>
    </>
  )
}