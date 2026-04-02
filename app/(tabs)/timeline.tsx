import React, { useState, useMemo, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Circle, Line, Text as SvgText, G } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLogs } from "../../hooks/useLogs";
import EditLogModal from "../../components/EditLogModal";
import { ENERGY_COLORS } from "../../utils/monthlyData";

const BG = "#0c0c0c";
const ACCENT = "#4DB8B2";
const TEXT_PRIMARY = "#E8E8E8";
const TEXT_SECONDARY = "#888888";

export default function TimelineScreen() {
    const { logs, isLoading } = useLogs();
    const insets = useSafeAreaInsets();
    const [view, setView] = useState<"daily" | "weekly">("daily");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingLog, setEditingLog] = useState<any | null>(null);
    const screenWidth = Dimensions.get("window").width;



    const goToPreviousDay = () => {
        const step = view === "daily" ? 1 : 7;
        setSelectedDate(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() - step);
            return d;
        });
    };

    const goToNextDay = () => {
        const step = view === "daily" ? 1 : 7;
        setSelectedDate(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() + step);
            return d;
        });
    };

    const formatDate = (date: Date) => {
        const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
        const day = date.toLocaleDateString("en-US", { day: "numeric" });
        const month = date.toLocaleDateString("en-US", { month: "short" });
        return `${weekday} ${day} ${month}`;
    };

    const formatTime = (timestamp: string | number) => {
        return new Date(timestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });
    };

    const dailyLogs = useMemo(() => {
        if (!logs) return [];
        return logs
            .filter((log) => {
                const d = new Date(log.timestamp);
                return (
                    d.getFullYear() === selectedDate.getFullYear() &&
                    d.getMonth() === selectedDate.getMonth() &&
                    d.getDate() === selectedDate.getDate()
                );
            })
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [logs, selectedDate]);

    const handlePointPress = (log: any) => {
        if (!log) return;
        console.log("pressed", log);
        setEditingLog(log);
        setIsModalVisible(true);
    };

    const openEditModal = (log: any) => {
        setEditingLog(log);
        setIsModalVisible(true);
    };

    // Daily Chart Data (Clean Architecture - Latest Value Wins Per Hour)
    const dailyChartData = useMemo(() => {
        const hourMap = new Map<number, typeof dailyLogs[0]>();

        dailyLogs.forEach(log => {
            const d = new Date(log.timestamp);
            const hour = d.getHours();
            const existingLog = hourMap.get(hour);

            if (!existingLog || new Date(log.timestamp).getTime() > new Date(existingLog.timestamp).getTime()) {
                hourMap.set(hour, log);
            }
        });

        const reducedLogs = Array.from(hourMap.values())
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        return reducedLogs.map(log => {
            const d = new Date(log.timestamp);
            const decimalHour = d.getHours() + d.getMinutes() / 60;
            return {
                x: decimalHour,
                y: log.energy,
                originalLog: log,
            };
        });
    }, [dailyLogs]);

    const weeklyData = useMemo(() => {
        if (!logs) return new Array(7).fill({ date: new Date(), average: null });

        // Compute Monday of current week
        const baseDate = new Date(selectedDate);
        const day = baseDate.getDay();
        const diff = (day === 0 ? -6 : 1) - day;
        baseDate.setDate(baseDate.getDate() + diff);
        baseDate.setHours(0, 0, 0, 0);

        const week = [];
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(baseDate);
            currentDate.setDate(baseDate.getDate() + i);

            const dayLogs = logs.filter((log) => {
                const d = new Date(log.timestamp);
                return (
                    d.getFullYear() === currentDate.getFullYear() &&
                    d.getMonth() === currentDate.getMonth() &&
                    d.getDate() === currentDate.getDate()
                );
            });

            let average: number | null = null;
            if (dayLogs.length > 0) {
                const sum = dayLogs.reduce((acc, log) => acc + log.energy, 0);
                const avg = sum / dayLogs.length;
                average = Math.round(avg * 10) / 10;
            }

            const latestLog = dayLogs.length > 0 
                ? [...dayLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
                : null;

            week.push({
                date: currentDate,
                average: average,
                latestLog: latestLog,
            });
        }
        return week;
    }, [logs, selectedDate]);

    const getWeeklyHeader = () => {
        if (!weeklyData || weeklyData.length === 0) return "";
        const start = weeklyData[0].date;
        const end = weeklyData[6].date;
        const formatDay = (d: Date) => {
            const day = d.getDate();
            const month = d.toLocaleDateString("en-US", { month: "short" });
            return `${day} ${month}`;
        };
        return `${formatDay(start)} – ${formatDay(end)}`;
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentInsetAdjustmentBehavior="never"
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 32, paddingTop: insets.top + 12 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    {/* Centered Toggle */}
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity onPress={() => setView("daily")} activeOpacity={0.7}>
                            <View>
                                <Text style={[styles.toggleText, view === "daily" && styles.toggleTextActive]}>Daily</Text>
                                {view === "daily" && <View style={styles.toggleUnderline} />}
                            </View>
                        </TouchableOpacity>
                        <View style={{ width: 24 }} />
                        <TouchableOpacity onPress={() => setView("weekly")} activeOpacity={0.7}>
                            <View>
                                <Text style={[styles.toggleText, view === "weekly" && styles.toggleTextActive]}>Weekly</Text>
                                {view === "weekly" && <View style={styles.toggleUnderline} />}
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Date Navigation Row */}
                    <View style={styles.dateNavRow}>
                        <TouchableOpacity onPress={goToPreviousDay}>
                            <Ionicons name="chevron-back" size={24} color={TEXT_PRIMARY} />
                        </TouchableOpacity>
                        <Text style={styles.dateText}>{view === "daily" ? formatDate(selectedDate) : getWeeklyHeader()}</Text>
                        <TouchableOpacity onPress={goToNextDay}>
                            <Ionicons name="chevron-forward" size={24} color={TEXT_PRIMARY} />
                        </TouchableOpacity>
                    </View>

                    {/* Chart Container */}
                    <View style={styles.chartContainer}>
                        {view === "daily" ? (() => {
                            const PADDING = { top: 16, bottom: 24, left: 16, right: 16 };
                            const CHART_HEIGHT = 220;
                            const CHART_WIDTH = screenWidth - 32; // 16px padding on each side defined in content style
                            const drawWidth = CHART_WIDTH - PADDING.left - PADDING.right;
                            const drawHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

                            const mapX = (x: number) => PADDING.left + (x / 24) * drawWidth;
                            const mapY = (y: number) => PADDING.top + drawHeight - ((y - 1) / 4) * drawHeight;

                            const pathData = dailyChartData.length > 0
                                ? dailyChartData.map((d, i) => `${i === 0 ? "M" : "L"} ${mapX(d.x)} ${mapY(d.y)}`).join(" ")
                                : "";

                            return (
                                <View style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}>
                                    <Svg width="100%" height="100%">
                                        {/* Y Axis line */}
                                        <Line x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={CHART_HEIGHT - PADDING.bottom} stroke={TEXT_SECONDARY} strokeWidth={1} />

                                        {/* Y Axis Ticks */}
                                        {[1, 2, 3, 4, 5].map(tick => (
                                            <SvgText key={`y-${tick}`} x={PADDING.left - 10} y={mapY(tick)} fill={TEXT_SECONDARY} fontSize={11} textAnchor="end" alignmentBaseline="middle">
                                                {tick}
                                            </SvgText>
                                        ))}

                                        {/* X Axis line */}
                                        <Line x1={PADDING.left} y1={CHART_HEIGHT - PADDING.bottom} x2={CHART_WIDTH - PADDING.right} y2={CHART_HEIGHT - PADDING.bottom} stroke={TEXT_SECONDARY} strokeWidth={1} />

                                        {/* X Axis Ticks */}
                                        {[0, 3, 6, 9, 12, 15, 18, 21].map(tick => {
                                            const label = tick === 0 ? "12AM" : tick === 12 ? "12PM" : tick < 12 ? `${tick}AM` : `${tick - 12}PM`;
                                            return (
                                                <SvgText key={`x-${tick}`} x={mapX(tick)} y={CHART_HEIGHT - PADDING.bottom + 15} fill={TEXT_SECONDARY} fontSize={11} textAnchor="middle">
                                                    {label}
                                                </SvgText>
                                            );
                                        })}



                                        {/* Connecting Line Segments */}
                                        {dailyChartData.length > 1 ? dailyChartData.map((d, i) => {
                                            if (i === 0) return null;
                                            const prev = dailyChartData[i - 1];
                                            return (
                                                <Line 
                                                    key={`line-${i}`}
                                                    x1={mapX(prev.x)} 
                                                    y1={mapY(prev.y)} 
                                                    x2={mapX(d.x)} 
                                                    y2={mapY(d.y)} 
                                                    stroke={ENERGY_COLORS[Math.round(d.originalLog.energy)] || TEXT_PRIMARY} 
                                                    strokeWidth={1.5} 
                                                />
                                            );
                                        }) : null}

                                        {/* Log Points */}
                                        {dailyChartData.map((d, i) => (
                                            <Circle 
                                                key={`point-${i}`}
                                                cx={mapX(d.x)} 
                                                cy={mapY(d.y)} 
                                                r={4} 
                                                fill={ENERGY_COLORS[Math.round(d.originalLog.energy)] || TEXT_PRIMARY} 
                                                stroke="transparent"
                                                strokeWidth={20}
                                                onPress={() => handlePointPress(d.originalLog)}
                                            />
                                        ))}
                                    </Svg>
                                </View>
                            );
                        })() : (() => {
                            const PADDING = { top: 16, bottom: 24, left: 16, right: 16 };
                            const CHART_HEIGHT = 220;
                            const CHART_WIDTH = screenWidth - 32;
                            const drawWidth = CHART_WIDTH - PADDING.left - PADDING.right;
                            const drawHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

                            const mapX = (index: number) => PADDING.left + (index / 6) * drawWidth;
                            const mapY = (y: number) => PADDING.top + drawHeight - ((y - 1) / 4) * drawHeight;

                            const validPoints = weeklyData.map((d, i) => ({ ...d, index: i })).filter(d => d.average !== null);
                            const pathData = validPoints.length > 0
                                ? validPoints.map((d, i) => `${i === 0 ? "M" : "L"} ${mapX(d.index)} ${mapY(d.average as number)}`).join(" ")
                                : "";

                            return (
                                <View style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}>
                                    <Svg width="100%" height="100%">
                                        {/* Y Axis line */}
                                        <Line x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={CHART_HEIGHT - PADDING.bottom} stroke={TEXT_SECONDARY} strokeWidth={1} />

                                        {/* Y Axis Ticks */}
                                        {[1, 2, 3, 4, 5].map(tick => (
                                            <SvgText key={`yw-${tick}`} x={PADDING.left - 10} y={mapY(tick)} fill={TEXT_SECONDARY} fontSize={11} textAnchor="end" alignmentBaseline="middle">
                                                {tick}
                                            </SvgText>
                                        ))}

                                        {/* X Axis line */}
                                        <Line x1={PADDING.left} y1={CHART_HEIGHT - PADDING.bottom} x2={CHART_WIDTH - PADDING.right} y2={CHART_HEIGHT - PADDING.bottom} stroke={TEXT_SECONDARY} strokeWidth={1} />

                                        {/* X Axis Ticks */}
                                        {weeklyData.map((d, i) => {
                                            const label = d.date.toLocaleDateString("en-US", { weekday: "short" });
                                            return (
                                                <SvgText key={`xw-${i}`} x={mapX(i)} y={CHART_HEIGHT - PADDING.bottom + 15} fill={TEXT_SECONDARY} fontSize={11} textAnchor="middle">
                                                    {label}
                                                </SvgText>
                                            );
                                        })}



                                        {/* Connecting Line Segments */}
                                        {validPoints.length > 1 ? validPoints.map((d, i) => {
                                            if (i === 0) return null;
                                            const prev = validPoints[i - 1];
                                            return (
                                                <Line 
                                                    key={`linew-${d.index}`}
                                                    x1={mapX(prev.index)} 
                                                    y1={mapY(prev.average as number)} 
                                                    x2={mapX(d.index)} 
                                                    y2={mapY(d.average as number)} 
                                                    stroke={ENERGY_COLORS[Math.max(1, Math.min(5, Math.round(d.average as number)))] || TEXT_PRIMARY} 
                                                    strokeWidth={1.5} 
                                                />
                                            );
                                        }) : null}

                                        {/* Log Points */}
                                        {validPoints.map(d => (
                                            <Circle 
                                                key={`pointw-${d.index}`}
                                                cx={mapX(d.index)} 
                                                cy={mapY(d.average as number)} 
                                                r={4} 
                                                fill={ENERGY_COLORS[Math.max(1, Math.min(5, Math.round(d.average as number)))] || TEXT_PRIMARY} 
                                                stroke="transparent"
                                                strokeWidth={20}
                                                onPress={() => handlePointPress(d.latestLog)}
                                            />
                                        ))}
                                    </Svg>
                                </View>
                            );
                        })()}
                    </View>

                    {/* Logs Section */}
                    <View style={styles.logsSection}>
                        <Text style={styles.sectionTitle}>LOGS</Text>
                        <View style={styles.logsList}>
                            {view === "daily" ? (
                                isLoading ? (
                                    <Text style={styles.placeholderText}>Loading...</Text>
                                ) : dailyLogs.length === 0 ? (
                                    <Text style={styles.placeholderText}>No entries yet</Text>
                                ) : (
                                    [...dailyLogs]
                                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                        .map((log) => (
                                            <TouchableOpacity 
                                                key={log.id} 
                                                style={styles.logRow}
                                                onPress={() => handlePointPress(log)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={styles.logLevel}>Level {log.energy}</Text>
                                                <Text style={styles.logTime}>{formatTime(log.timestamp)}</Text>
                                            </TouchableOpacity>
                                        ))
                                )
                            ) : (
                                weeklyData.map((d, index) => (
                                    <TouchableOpacity 
                                        key={index} 
                                        style={styles.logRow}
                                        onPress={() => handlePointPress(d.latestLog)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.logLevel}>
                                            {d.average !== null ? `Avg ${d.average}` : "No entries yet"}
                                        </Text>
                                        <Text style={styles.logTime}>
                                            {d.date.toLocaleDateString("en-US", {
                                                weekday: "short",
                                                day: "numeric",
                                                month: "short"
                                            })}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    </View>
                    <EditLogModal 
                        visible={isModalVisible}
                        onClose={() => setIsModalVisible(false)}
                        log={editingLog}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        // paddingBottom handled via inline style and insets
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    toggleContainer: {
        flexDirection: "row",
        marginBottom: 8,
        marginTop: 4,
        alignItems: "center",
        justifyContent: "center",
    },
    toggleText: {
        fontSize: 14,
        color: TEXT_SECONDARY,
        fontWeight: "500",
        paddingVertical: 8,
    },
    toggleTextActive: {
        color: TEXT_PRIMARY,
    },
    toggleUnderline: {
        height: 3,
        backgroundColor: ACCENT,
        marginTop: 4,
        width: "100%",
    },
    dateNavRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        marginBottom: 16,
    },
    dateText: {
        fontSize: 18,
        color: TEXT_PRIMARY,
        marginHorizontal: 20,
        fontWeight: "600",
    },
    chartContainer: {
        marginTop: 0,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
    },
    chart: {
        // Legacy chart-kit margins removed
    },
    logsSection: {
        marginTop: 24,
        width: "100%",
    },
    logsList: {
        gap: 8,
    },
    sectionTitle: {
        fontSize: 13,
        color: TEXT_SECONDARY,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        marginBottom: 12,
        fontWeight: "500",
    },
    placeholderText: {
        fontSize: 14,
        color: TEXT_SECONDARY,
        fontWeight: "300",
    },
    logRow: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "baseline",
        gap: 6,
        width: "100%",
        paddingVertical: 16,
    },
    logTime: {
        fontSize: 14,
        color: TEXT_SECONDARY,
        fontWeight: "400",
        opacity: 0.8,
    },
    logLevel: {
        fontSize: 16,
        color: TEXT_PRIMARY,
        fontWeight: "500",
        minWidth: 60,
    },
});
