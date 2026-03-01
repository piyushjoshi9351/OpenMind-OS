"use client"

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { GraphClusterInsight, GraphDataModel } from '@/types';

interface GraphProps {
  data: GraphDataModel;
  weakClusters: GraphClusterInsight[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

type SimNode = d3.SimulationNodeDatum & GraphDataModel['nodes'][number];
type SimLink = d3.SimulationLinkDatum<SimNode> & GraphDataModel['links'][number];

const NODE_COLOR_BY_TYPE: Record<GraphDataModel['nodes'][number]['type'], string> = {
  skill: '#5ca7ff',
  topic: '#b678ff',
  goal: '#6ff7ff',
  note: 'hsl(var(--muted-foreground))',
};

export function KnowledgeGraph({ data, weakClusters, selectedNodeId, onSelectNode }: GraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = 600;
    const weakNodeIds = new Set(weakClusters.flatMap((cluster) => cluster.nodeIds));

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    svg.selectAll("*").remove();

    const rootLayer = svg.append('g');

    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.6, 2.5])
        .on('zoom', (event) => {
          rootLayer.attr('transform', event.transform.toString());
        }),
    );

    const nodes: SimNode[] = data.nodes.map((node) => ({ ...node }));
    const links: SimLink[] = data.links.map((link) => ({ ...link }));

    const simulation = d3.forceSimulation<SimNode>(nodes)
      .force("link", d3.forceLink<SimNode, SimLink>(links).id((d) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = rootLayer.append("g")
      .attr("stroke", "rgba(116, 188, 255, 0.9)")
      .attr("stroke-opacity", 0.7)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "8 8");

    const animateLinks = () => {
      link
        .attr("stroke-dashoffset", 16)
        .transition()
        .duration(1600)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0)
        .on("end", animateLinks);
    };

    animateLinks();

    const node = rootLayer.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style('cursor', 'pointer')
      .on('click', (_, datum) => {
        onSelectNode(datum.id);
      });

    const applyDrag = drag(simulation) as unknown as (selection: d3.Selection<d3.BaseType | SVGGElement, SimNode, SVGGElement, unknown>) => void;
    node.call(applyDrag);

    const circles = node.append("circle")
      .attr("r", (datum) => datum.id === selectedNodeId ? 14 : 9)
      .attr("fill", (datum) => NODE_COLOR_BY_TYPE[datum.type] ?? 'hsl(var(--muted-foreground))')
      .attr("stroke", (datum) => weakNodeIds.has(datum.id) ? '#ff4d6d' : 'rgba(255,255,255,0.5)')
      .attr("stroke-width", (datum) => weakNodeIds.has(datum.id) ? 2.6 : 1.4)
      .style("filter", "drop-shadow(0 0 8px rgba(108,182,255,0.7))");

    node
      .on('mouseenter', function () {
        d3.select(this).select('circle').transition().duration(160).attr('r', 15);
      })
      .on('mouseleave', function (_, datum) {
        d3.select(this).select('circle').transition().duration(180).attr('r', datum.id === selectedNodeId ? 14 : 9);
      });

    const pulse = () => {
      circles
        .transition()
        .duration(1000)
        .attr('opacity', 0.7)
        .transition()
        .duration(1000)
        .attr('opacity', 1)
        .on('end', pulse);
    };

    pulse();

    node.append("text")
      .attr("x", 12)
      .attr("y", 4)
      .text((datum) => datum.title)
      .style("font-size", "12px")
      .style("font-family", "Inter, sans-serif")
      .style("fill", "hsl(var(--foreground))")
      .style("font-size", "11px");

    simulation.on("tick", () => {
      link
        .attr("x1", (datum) => (datum.source as SimNode).x ?? 0)
        .attr("y1", (datum) => (datum.source as SimNode).y ?? 0)
        .attr("x2", (datum) => (datum.target as SimNode).x ?? 0)
        .attr("y2", (datum) => (datum.target as SimNode).y ?? 0);

      node
        .attr("transform", (datum) => `translate(${datum.x ?? 0},${datum.y ?? 0})`);
    });

    function drag(simulationRef: d3.Simulation<SimNode, SimLink>) {
      function dragstarted(event: d3.D3DragEvent<Element, SimNode, SimNode>) {
        if (!event.active) simulationRef.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: d3.D3DragEvent<Element, SimNode, SimNode>) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: d3.D3DragEvent<Element, SimNode, SimNode>) {
        if (!event.active) simulationRef.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag<Element, SimNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [data, onSelectNode, selectedNodeId, weakClusters]);

  return (
    <div className="w-full h-full bg-card/60 backdrop-blur-xl rounded-2xl border border-border overflow-hidden relative">
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg border border-border text-xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-400" /> <span>Skill</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-400" /> <span>Topic</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-300" /> <span>Goal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted-foreground" /> <span>Note</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive" /> <span>Weak cluster</span>
        </div>
      </div>
    </div>
  );
}