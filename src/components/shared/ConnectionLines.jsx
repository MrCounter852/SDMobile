import React from "react";
import Svg, { Line } from "react-native-svg";

const STROKE_COLOR = "#337ab7";
const STROKE_WIDTH = 2;

export default function ConnectionLines({ verticalTop, verticalBottom, childrenLayouts, x }) {
  const ids = Object.keys(childrenLayouts);
  if (!ids.length) return null;

  return (
    <Svg
      style={{
        position: "absolute",
        left: x,
        top: verticalTop,
        width: 40,
        height: verticalBottom - verticalTop,
        pointerEvents: "none",
      }}
    >
      {/* Línea vertical */}
      <Line
        x1={0}
        y1={0}
        x2={0}
        y2={verticalBottom - verticalTop}
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />

      {/* Líneas horizontales */}
      {ids.map((id) => {
        const l = childrenLayouts[id];
        const y = l.y + l.height / 2 - verticalTop;
        return (
          <Line
            key={"line-" + id}
            x1={0}
            y1={y}
            x2={12}
            y2={y}
            stroke={STROKE_COLOR}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
}
