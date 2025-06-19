import React from "react";

interface Props {
  symbol: string | null;
}

export const StrategyDetail: React.FC<Props> = ({ symbol }) => {
  return (
    <div style={{ padding: "1rem", borderLeft: "1px solid #ccc", minWidth: "300px" }}>
      <h3>Strategy Details</h3>
      {symbol ? <p>Details for <strong>{symbol}</strong></p> : <p>No stock selected.</p>}
    </div>
  );
};
