// src/components/StockCardOverlay.tsx
import { memo, useCallback, useEffect } from "react";
import {
  useRive,
  Layout,
  Fit,
  Alignment,
  useStateMachineInput,
} from "@rive-app/react-canvas";

import fileUrl from "../assets/stock-card.riv";

const STATE_MACHINE = "FlipSM";

type Props = {
  open: boolean;
  onClose: () => void;
  stock: {
    symbol: string;
    pe: number;
    pb: number;
    de: number;
  } | null;
};

const StockCardOverlay = ({ open, onClose, stock }: Props) => {
  const { rive, RiveComponent } = useRive({
    src: fileUrl,
    stateMachines: STATE_MACHINE,
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  // inputs
  const flip = useStateMachineInput(rive, STATE_MACHINE, "flip");
  const barPE = useStateMachineInput(rive, STATE_MACHINE, "BarPEHeight");
  const barPB = useStateMachineInput(rive, STATE_MACHINE, "BarPBHeight");
  const barDE = useStateMachineInput(rive, STATE_MACHINE, "BarDEHeight");

  // set ticker text + bar values
  useEffect(() => {
    if (!rive || !stock) return;
    try {
      rive.setTextRunValue("StockTickerRun", stock.symbol);
    } catch {
      // ignore if run not exported
    }
    if (barPE) barPE.value = clamp01(stock.pe);
    if (barPB) barPB.value = clamp01(stock.pb);
    if (barDE) barDE.value = clamp01(stock.de);
  }, [rive, stock, barPE, barPB, barDE]);

  // on click: apply bar values + fire flip
  const handleClick = useCallback(() => {
    if (!stock) return;
    if (barPE) barPE.value = clamp01(stock.pe);
    if (barPB) barPB.value = clamp01(stock.pb);
    if (barDE) barDE.value = clamp01(stock.de);
    if (flip) flip.fire();
  }, [stock, barPE, barPB, barDE, flip]);

  if (!open) return null;

  return (
    <div
      className="stock-card-overlay"
      style={overlayStyle}
      onClick={onClose}
      role="dialog"
      aria-modal
    >
      <div
        style={cardWrapperStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <RiveComponent style={riveStyle} onClick={handleClick} />
        <button style={closeButtonStyle} onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
};

export default memo(StockCardOverlay);

/* ---------- helpers ---------- */
function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/* ---------- styles ---------- */
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const cardWrapperStyle: React.CSSProperties = {
  position: "relative",
//   background: "#0b0b0c",
  background: "transparent",
  borderRadius: 12,
  padding: 10,
//   boxShadow: "0 12px 28px rgba(0,0,0,0.4)",
};

const riveStyle: React.CSSProperties = {
  width: 640,
  height: 400,
  cursor: "pointer",
  background: "transparent",
  boxShadow: "none",
  border: "none",
  outline: "none",
};

const closeButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: 4,
  right: 4,
  background: "transparent",
  border: "none",
  color: "#fff",
  fontSize: 18,
  cursor: "pointer",
};
