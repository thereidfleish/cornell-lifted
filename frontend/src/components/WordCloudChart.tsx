"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import cloud from "d3-cloud";

interface WordCloudChartProps {
  words: Array<[string, number]>;
}

interface WordData {
  text: string;
  size: number;
  x?: number;
  y?: number;
}

export default function WordCloudChart({ words }: WordCloudChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || words.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const width = svgRef.current.clientWidth || 800;
    const height = 400;

    // Prepare data for word cloud
    const maxCount = Math.max(...words.map((w) => w[1]));
    const wordData: WordData[] = words.map(([text, value]) => ({
      text,
      size: 10 + (value / maxCount) * 60, // Scale font size between 10 and 70
    }));

    // Create word cloud layout
    const layout = cloud()
      .size([width, height])
      .words(wordData as any[])
      .padding(5)
      .rotate(() => 0)
      .fontSize((d: any) => d.size)
      .on("end", draw);

    layout.start();

    function draw(words: WordData[]) {
      const svg = d3
        .select(svgRef.current!)
        .attr("width", width)
        .attr("height", height);

      const g = svg
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

      g.selectAll("text")
        .data(words)
        .enter()
        .append("text")
        .style("font-size", (d: WordData) => `${d.size}px`)
        .style("font-family", "Inter, sans-serif")
        .style("fill", () => {
          // Shades of Cornell Red
          const shades = [
            "#B31B1B",
            "#C62828",
            "#D32F2F",
            "#E53935",
            "#F44336",
          ];
          return shades[Math.floor(Math.random() * shades.length)];
        })
        .attr("text-anchor", "middle")
        .attr("transform", (d: WordData) => `translate(${d.x},${d.y})`)
        .text((d: WordData) => d.text)
        .style("cursor", "default")
        .on("mouseover", function(this: SVGTextElement) {
          d3.select(this).style("opacity", 0.7);
        })
        .on("mouseout", function(this: SVGTextElement) {
          d3.select(this).style("opacity", 1);
        });
    }
  }, [words]);

  if (words.length === 0) {
    return (
      <div className="w-full flex justify-center items-center h-96">
        <p className="text-gray-500">No words to display</p>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <svg ref={svgRef} className="w-full max-w-4xl" style={{ height: "400px" }} />
    </div>
  );
}
