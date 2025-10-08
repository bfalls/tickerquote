// src/components/StockCardFloat.tsx
import { memo, useCallback, useEffect, useState } from "react";
import {
  useRive,
  Layout,
  Fit,
  Alignment,
  useStateMachineInput,
} from "@rive-app/react-canvas";
import fileUrl from "../assets/stock-card.riv";

const STATE_MACHINE = "FlipSM";

type StockData = {
  symbol: string;
  pe: number;
  pb: number;
  de: number;
  net?: number;
  roe?: number;
  opm?: number;
  fwdPE?: number;
  revG?: number;
  div?: number;
};

type Props = {
  show: boolean;
  stock: StockData | null;
  style?: React.CSSProperties;
  tickerTextRunName?: string;
};

const StockCardFloat = ({
  show,
  stock,
  style,
  tickerTextRunName = "StockTextRun",
}: Props) => {
  const { rive, RiveComponent } = useRive({
    src: fileUrl,
    stateMachines: STATE_MACHINE,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  });

  // --- Rive inputs
  const toBack = useStateMachineInput(rive, STATE_MACHINE, "toBack");
  const toFront = useStateMachineInput(rive, STATE_MACHINE, "toFront");
  const barPE = useStateMachineInput(rive, STATE_MACHINE, "BarPEHeight");
  const barPB = useStateMachineInput(rive, STATE_MACHINE, "BarPBHeight");
  const barDE = useStateMachineInput(rive, STATE_MACHINE, "BarDEHeight");

  // --- local flip flag
  const [isBack, setIsBack] = useState(false);

  // --- set text + bar values whenever stock changes
  useEffect(() => {
    if (!rive || !stock) return;

    // --- helper for safe text update
    const setRun = (name: string, value: string) => {
      try {
        rive?.setTextRunValue(name, value);
      } catch {
        // silently ignore if TextRun missing in .riv
      }
    };

    // base ticker
    setRun(tickerTextRunName, stock.symbol);

    if (barPE) barPE.value = clamp01(stock.pe);
    if (barPB) barPB.value = clamp01(stock.pb);
    if (barDE) barDE.value = clamp01(stock.de);

    // formatted front metrics
    setRun("NetRun", fmtPct(stock.net));
    setRun("ROERun", fmtPct(stock.roe));
    setRun("OpMRun", fmtPct(stock.opm));
    setRun("FwdPERun", fmtNum(stock.fwdPE));
    setRun("RevGRun", fmtPct(stock.revG));
    setRun("DivRun", fmtPct(stock.div, 2));
  }, [rive, stock, barPE, barPB, barDE, tickerTextRunName]);

  // --- click handler: toggle flip direction
  const handleClick = useCallback(() => {
    if (!stock) return;
    if (isBack) toFront?.fire();
    else toBack?.fire();
    setIsBack(!isBack);

    if (barPE) barPE.value = clamp01(stock.pe);
    if (barPB) barPB.value = clamp01(stock.pb);
    if (barDE) barDE.value = clamp01(stock.de);
  }, [isBack, stock, barPE, barPB, barDE, toFront, toBack]);

  if (!show) return null;

  return (
    <div className="rive-card-float" style={{ ...floatWrapStyle, ...style }}>
      <RiveComponent style={riveCanvasStyle} onClick={handleClick} />
    </div>
  );
};

export default memo(StockCardFloat);

/* helpers */
function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
function fmtPct(n?: number, d: number = 1) {
  return n != null ? `${n.toFixed(d)}%` : "";
}
function fmtNum(n?: number) {
  return n != null ? n.toFixed(1) : "";
}

/* styles */
const floatWrapStyle: React.CSSProperties = {
  position: "fixed",
  right: 24,
  bottom: 24,
  pointerEvents: "none",
  zIndex: 1000,
};
const riveCanvasStyle: React.CSSProperties = {
  width: 420,
  height: 280,
  background: "transparent",
  border: "none",
  outline: "none",
  pointerEvents: "auto",
  cursor: "pointer",
};
