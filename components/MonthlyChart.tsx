import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { ENERGY_COLORS } from '../utils/monthlyData';

export type DailyAverage = {
    day: number;
    average: number | null;
};

export type ChartPoint = {
    x: number;
    y: number;
    day: number;
};

export interface MonthlyChartProps {
    dailyAverages: DailyAverage[];
    chartPoints: ChartPoint[];
    width: number;
    height: number;
}

const PADDING = { top: 16, bottom: 16, left: 16, right: 16 };

export default function MonthlyChart({ dailyAverages, chartPoints, width, height }: MonthlyChartProps) {
    const totalDays = dailyAverages.length;

    const drawWidth = width - PADDING.left - PADDING.right;
    const drawHeight = height - PADDING.top - PADDING.bottom;

    // We apply the PADDING.left / PADDING.top offsets here during SVG layout
    const offsetX = (x: number) => PADDING.left + x;
    const offsetY = (y: number) => PADDING.top + y;

    // Determine X ticks to show
    const xTicksArray = [1, 5, 10, 15, 20, 25];
    if (totalDays > 0 && !xTicksArray.includes(totalDays)) {
        xTicksArray.push(totalDays);
    }

    // Compute tick positions
    const getXTickPosition = (day: number) => {
        let x = 0;
        if (totalDays > 1) {
            x = ((day - 1) / (totalDays - 1)) * drawWidth;
        }
        return offsetX(x);
    };

    const getYTickPosition = (val: number) => {
        const y = drawHeight - ((val - 1) / 4) * drawHeight;
        return offsetY(y);
    };

    // Calculate line path segmented around nulls
    let pathData = "";
    let isDrawing = false;
    
    for (const d of dailyAverages) {
        if (d.average === null) {
            isDrawing = false; // Break the line segment
            continue;
        }
        
        const point = chartPoints.find(p => p.day === d.day);
        if (!point) continue;
        
        if (!isDrawing) {
            pathData += `M ${offsetX(point.x)} ${offsetY(point.y)} `;
            isDrawing = true;
        } else {
            pathData += `L ${offsetX(point.x)} ${offsetY(point.y)} `;
        }
    }

    const hasPoints = chartPoints.length > 0;

    function formatDayOrdinal(day: number): string {
        const j = day % 10;
        const k = day % 100;
        if (j === 1 && k !== 11) {
            return day + "st";
        }
        if (j === 2 && k !== 12) {
            return day + "nd";
        }
        if (j === 3 && k !== 13) {
            return day + "rd";
        }
        return day + "th";
    }

    return (
        <View style={{ width, height }}>
            <Svg width="100%" height="100%">
                {/* Y Axis line */}
                <Line
                    x1={PADDING.left}
                    y1={PADDING.top}
                    x2={PADDING.left}
                    y2={height - PADDING.bottom}
                    stroke="#E8E8E8"
                    strokeWidth={1}
                />

                {/* Y Axis Ticks */}
                {[1, 2, 3, 4, 5].map(tick => (
                    <SvgText
                        key={`ym-${tick}`}
                        x={PADDING.left - 10}
                        y={getYTickPosition(tick)}
                        fill="#888888"
                        fontSize={11}
                        textAnchor="end"
                        alignmentBaseline="middle"
                    >
                        {tick}
                    </SvgText>
                ))}

                {/* X Axis line */}
                <Line
                    x1={PADDING.left}
                    y1={height - PADDING.bottom}
                    x2={width - PADDING.right}
                    y2={height - PADDING.bottom}
                    stroke="#E8E8E8"
                    strokeWidth={1}
                />

                {/* X Axis Ticks */}
                {xTicksArray.map(day => (
                    <SvgText
                        key={`xm-${day}`}
                        x={getXTickPosition(day)}
                        y={height - PADDING.bottom + 15}
                        fill="#888888"
                        fontSize={11}
                        textAnchor="middle"
                    >
                        {formatDayOrdinal(day)}
                    </SvgText>
                ))}

                {/* Connecting Line Segments */}
                {hasPoints && chartPoints.length > 1 ? chartPoints.map((p, i) => {
                    if (i === 0) return null;
                    const prev = chartPoints[i - 1];
                    const dailyAvg = dailyAverages.find(da => da.day === p.day);
                    const avg = dailyAvg?.average ?? 3;
                    const rounded = Math.max(1, Math.min(5, Math.round(avg)));
                    return (
                        <Line
                            key={`line-${p.day}`}
                            x1={offsetX(prev.x)}
                            y1={offsetY(prev.y)}
                            x2={offsetX(p.x)}
                            y2={offsetY(p.y)}
                            stroke={ENERGY_COLORS[rounded] || "#E8E8E8"}
                            strokeWidth={1.5}
                        />
                    );
                }) : null}

                {/* Log Points */}
                {chartPoints.map(p => {
                    const dailyAvg = dailyAverages.find(da => da.day === p.day);
                    const avg = dailyAvg?.average ?? 3;
                    const rounded = Math.max(1, Math.min(5, Math.round(avg)));
                    return (
                        <Circle
                            key={`pointm-${p.day}`}
                            cx={offsetX(p.x)}
                            cy={offsetY(p.y)}
                            r={2.8}
                            fill={ENERGY_COLORS[rounded] || "#E8E8E8"}
                        />
                    );
                })}
            </Svg>
        </View>
    );
}
