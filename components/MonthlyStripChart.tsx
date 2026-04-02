import React from 'react';
import Svg, { Rect, Line } from 'react-native-svg';
import { MonthlyStripLayoutEntry } from '../utils/monthlyData';

type MonthlyStripChartProps = {
    layoutData: MonthlyStripLayoutEntry[];
    width: number;
    height: number;
};

export function MonthlyStripChart({ layoutData, width, height }: MonthlyStripChartProps) {
    const levelHeight = height / 5;
    const guides = [1, 2, 3, 4];

    return (
        <Svg width={width} height={height}>
            {guides.map((g) => (
                <Line
                    key={`strip-guide-${g}`}
                    x1={0}
                    y1={g * levelHeight}
                    x2={width}
                    y2={g * levelHeight}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={1}
                />
            ))}
            {layoutData.map((item) => {
                if (item.color === null) {
                    return null;
                }

                return (
                    <Rect
                        key={`strip-rect-${item.day}`}
                        x={item.x}
                        y={item.y as number}
                        width={item.width}
                        height={item.height as number}
                        fill={item.color}
                        rx={item.width / 2}
                        ry={item.width / 2}
                    />
                );
            })}
        </Svg>
    );
}

export default MonthlyStripChart;
