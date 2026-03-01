"use client";

import { motion } from 'framer-motion';

const nodes = [
  { id: 'a', x: 30, y: 45, type: 'skill', color: '#5ca7ff' },
  { id: 'b', x: 48, y: 24, type: 'topic', color: '#b678ff' },
  { id: 'c', x: 68, y: 50, type: 'goal', color: '#6ff7ff' },
  { id: 'd', x: 46, y: 72, type: 'topic', color: '#b678ff' },
  { id: 'e', x: 18, y: 70, type: 'skill', color: '#5ca7ff' },
  { id: 'f', x: 82, y: 76, type: 'goal', color: '#6ff7ff' },
];

const links = [
  ['a', 'b'],
  ['a', 'd'],
  ['b', 'c'],
  ['d', 'c'],
  ['e', 'a'],
  ['c', 'f'],
];

const nodeMap = new Map(nodes.map((node) => [node.id, node]));

export function NeuralGraphPreview() {
  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="text-sm font-semibold mb-3">Neural Brain Network Preview</div>
      <svg viewBox="0 0 100 100" className="w-full h-48">
        {links.map(([source, target], index) => {
          const from = nodeMap.get(source);
          const to = nodeMap.get(target);
          if (!from || !to) {
            return null;
          }
          return (
            <motion.line
              key={`${source}-${target}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="rgba(116, 188, 255, 0.75)"
              strokeWidth="0.5"
              initial={{ pathLength: 0, opacity: 0.2 }}
              animate={{ pathLength: 1, opacity: [0.2, 0.9, 0.35] }}
              transition={{ duration: 1.6, delay: index * 0.08, repeat: Infinity, repeatType: 'mirror' }}
            />
          );
        })}

        {nodes.map((node) => (
          <motion.circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r="1.8"
            fill={node.color}
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.9, 1.35, 0.9], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: node.x / 100 }}
          />
        ))}
      </svg>
    </div>
  );
}
