import React from 'react';
import type { StrategyName } from "../types";

export type Strategy = {
  id: string;
  name: string;
  description: string;
};

interface Props {
  strategies: StrategyName[];
  selected: StrategyName;
  onSelect: (strategy: StrategyName) => void;
}

export const StrategyCarousel: React.FC<Props> = ({ strategies, selected, onSelect }) => {
  return (
    <div className="flex overflow-x-auto gap-4 py-2">
      {strategies.map((name) => (
        <div
          key={name}
          className={`min-w-[200px] p-4 rounded-xl shadow cursor-pointer ${
            selected === name ? 'bg-blue-200' : 'bg-white'
          }`}
          onClick={() => onSelect(name)}
        >
          <h2 className="text-lg font-bold">{name}</h2>
        </div>
      ))}
    </div>
  );
};
