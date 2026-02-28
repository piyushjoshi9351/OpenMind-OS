"use client"

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { KnowledgeNode } from '@/types';

interface GraphProps {
  data: {
    nodes: KnowledgeNode[];
    links: { source: string; target: string }[];
  };
}

export function KnowledgeGraph({ data }: GraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = 600;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation(data.nodes as any)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", 2);

    const node = svg.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .call(drag(simulation) as any);

    node.append("circle")
      .attr("r", (d: any) => d.type === 'Goal' ? 12 : 8)
      .attr("fill", (d: any) => {
        switch (d.type) {
          case 'Goal': return 'hsl(var(--primary))';
          case 'Skill': return 'hsl(var(--accent))';
          case 'Topic': return '#f59e0b';
          default: return '#9ca3af';
        }
      });

    node.append("text")
      .attr("x", 12)
      .attr("y", 4)
      .text((d: any) => d.label)
      .style("font-size", "12px")
      .style("font-family", "Inter, sans-serif")
      .style("fill", "#374151");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function drag(simulation: any) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => simulation.stop();
  }, [data]);

  return (
    <div className="w-full h-full bg-white rounded-xl border border-border overflow-hidden relative">
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-border text-xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" /> <span>Goal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent" /> <span>Skill</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" /> <span>Topic</span>
        </div>
      </div>
    </div>
  );
}