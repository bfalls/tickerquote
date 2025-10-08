// src/components/BouncingTextOverlay.tsx
import { memo } from "react";
import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";
import fileUrl from "../assets/bouncing-text.riv";

const BouncingTextOverlay = () => {
  const { RiveComponent } = useRive({
    src: fileUrl,
    artboard: "TextArtboard",      // <-- match your artboard name
    animations: "BounceAcross",    // <-- this is your timeline name
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  return (
    <div className="rive-text-overlay" aria-hidden>
      <RiveComponent />
    </div>
  );
};

export default memo(BouncingTextOverlay);
