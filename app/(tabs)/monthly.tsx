import React, { useState, useMemo, useRef, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLogs } from "../../hooks/useLogs";
import { getMonthlyDailyAverages, createMonthlyChartPoints, createMonthlyLevelMap, createMonthlyStripLayout, ENERGY_COLORS } from "../../utils/monthlyData";
import MonthlyChart from "../../components/MonthlyChart";
import MonthlyStripChart from "../../components/MonthlyStripChart";

const BG = "#0c0c0c";
const TEXT_PRIMARY = "#E8E8E8";
const TEXT_SECONDARY = "#888888";
const PADDING = { top: 20, bottom: 30, left: 30, right: 20 };

export default function MonthlyScreen() {
    const insets = useSafeAreaInsets();
    const { logs } = useLogs();
    const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

    // Fix chart dimensions consistently mirroring Weekly architecture
    const screenWidth = Dimensions.get("window").width;
    const CHART_WIDTH = screenWidth - 32;
    const CHART_HEIGHT = 220;
    const STRIP_HEIGHT = 140;

    // Use inner dimensions for coordinates
    const drawWidth = CHART_WIDTH - PADDING.left - PADDING.right;
    const drawHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

    // Isolate robust data transformation layers
    const dailyAverages = useMemo(() => {
        return getMonthlyDailyAverages(selectedMonth, logs || []);
    }, [selectedMonth, logs]);

    const levelMap = useMemo(() => {
        return createMonthlyLevelMap(dailyAverages);
    }, [dailyAverages]);

    const stripWidth = dailyAverages.length * 15; // totalDays * 15 (approx, using 15 for better touch/vis)

    const stripLayoutData = useMemo(() => {
        return createMonthlyStripLayout(levelMap, stripWidth, STRIP_HEIGHT);
    }, [levelMap, stripWidth, STRIP_HEIGHT]);

    const levelCounts = useMemo(() => {
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        levelMap.forEach((entry) => {
            if (entry.level !== null && entry.level >= 1 && entry.level <= 5) {
                counts[entry.level as 1 | 2 | 3 | 4 | 5]++;
            }
        });
        return counts;
    }, [levelMap]);

    const chartPoints = useMemo(() => {
        return createMonthlyChartPoints(dailyAverages, drawWidth, drawHeight);
    }, [dailyAverages, drawWidth, drawHeight]);

    const goToPreviousMonth = () => {
        setSelectedMonth((prev) => {
            return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
        });
    };

    const goToNextMonth = () => {
        setSelectedMonth((prev) => {
            return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
        });
    };

    const formattedMonth = selectedMonth.toLocaleString('default', { 
        month: 'short', 
        year: 'numeric' 
    });

    // --- SCROLL PRESERVATION & INITIAL END-SCROLL LOGIC ---
    const stripScrollViewRef = useRef<ScrollView>(null);
    const [stripLayoutWidth, setStripLayoutWidth] = useState<number>(0);
    const [readyMonth, setReadyMonth] = useState<string | null>(null);

    const monthKey = `${selectedMonth.getFullYear()}-${selectedMonth.getMonth()}`;

    useEffect(() => {
        setReadyMonth(null);
    }, [monthKey]);

    useEffect(() => {
        if (stripLayoutWidth > 0 && readyMonth !== monthKey) {
            const isCurrentMonth = selectedMonth.getMonth() === new Date().getMonth() && selectedMonth.getFullYear() === new Date().getFullYear();
            const currentDay = new Date().getDate();
            const slotWidth = 15;
            
            // View padding (16*2) + ScrollView paddingRight (16)
            const totalContentWidth = stripWidth + 48; 
            
            let targetX = 0;
            if (isCurrentMonth) {
                // Focus around today (a bit to the left so past is visible)
                const todayPosition = (currentDay - 1) * slotWidth;
                targetX = Math.max(0, todayPosition - (stripLayoutWidth * 0.3));
            } else {
                // Focus on end
                targetX = Math.max(0, totalContentWidth - stripLayoutWidth);
            }
            
            setTimeout(() => {
                stripScrollViewRef.current?.scrollTo({ x: targetX, animated: false });
                setTimeout(() => setReadyMonth(monthKey), 10);
            }, 10);
        }
    }, [stripLayoutWidth, monthKey, readyMonth, selectedMonth, stripWidth]);
    // ------------------------------------------------------

    return (
        <View style={styles.container}>
            <ScrollView 
                style={{ flex: 1 }}
                contentInsetAdjustmentBehavior="never"
                contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingTop: insets.top + 12 }}
                showsVerticalScrollIndicator={false}
                directionalLockEnabled={true}
            >
            <View style={styles.header}>
                <Text style={styles.monthText}>{formattedMonth}</Text>

                <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
                    <Ionicons name="chevron-back" size={24} color={TEXT_PRIMARY} />
                </TouchableOpacity>

                <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                    <Ionicons name="chevron-forward" size={24} color={TEXT_PRIMARY} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Activity</Text>
                <View style={[styles.stripContainer, { marginTop: 16 }]}>
                    <ScrollView 
                        ref={stripScrollViewRef}
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        directionalLockEnabled={true}
                        onLayout={(e) => setStripLayoutWidth(e.nativeEvent.layout.width)}
                        decelerationRate="fast"
                        contentContainerStyle={{ paddingRight: 16 }}
                        style={{ opacity: readyMonth === monthKey ? 1 : 0 }}
                    >
                        <View style={{ padding: 16 }}>
                            <MonthlyStripChart
                                layoutData={stripLayoutData}
                                width={stripWidth}
                                height={STRIP_HEIGHT}
                            />
                            <View style={styles.stripLabelsContainer}>
                                {stripLayoutData.map((item) => {
                                    const showLabel = [1, 8, 15, 22, dailyAverages.length].includes(item.day);
                                    if (!showLabel) return null;
                                    return (
                                        <Text 
                                            key={`strip-date-${item.day}`} 
                                            style={[
                                                styles.stripDateLabel, 
                                                { 
                                                    left: (item.day - 1) * item.slotWidth + (item.slotWidth / 2) - 15, 
                                                    width: 30 
                                                }
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {item.day}
                                        </Text>
                                    );
                                })}
                            </View>
                        </View>
                    </ScrollView>
                </View>

                <View style={[styles.countsRow, { marginTop: 24 }]}>
                    {[1, 2, 3, 4, 5].map((level) => {
                        const labels: Record<number, string> = {
                            1: "Awful",
                            2: "Bad",
                            3: "Fine",
                            4: "Good",
                            5: "Amazing",
                        };
                        return (
                            <View key={`count-${level}`} style={styles.countItem}>
                                <Text style={styles.countValue}>
                                    {levelCounts[level as 1 | 2 | 3 | 4 | 5]}
                                </Text>
                                <Text style={styles.countLabel}>{labels[level]}</Text>
                                <View style={[styles.colorIndicator, { backgroundColor: ENERGY_COLORS[level] }]} />
                            </View>
                        );
                    })}
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Trend</Text>
                <View style={[styles.chartContainer, { marginTop: 16 }]}>
                    <MonthlyChart 
                        dailyAverages={dailyAverages}
                        chartPoints={chartPoints}
                        width={CHART_WIDTH}
                        height={CHART_HEIGHT}
                    />
                </View>
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
        paddingVertical: 0,
        paddingHorizontal: 16,
        marginTop: 4,
    },
    navButton: {
        padding: 8,
    },
    monthText: {
        position: "absolute",
        left: 0,
        right: 0,
        fontSize: 18,
        color: TEXT_PRIMARY,
        fontWeight: "600",
        textAlign: "center",
    },
    sectionTitle: {
        fontSize: 13,
        color: TEXT_SECONDARY,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        fontWeight: "500",
        textAlign: "left",
    },
    content: {
        flex: 1,
        alignItems: "flex-start",
        width: "100%",
        paddingHorizontal: 16,
    },
    stripContainer: {
        alignItems: "flex-start",
        justifyContent: "center",
        width: "100%",
    },
    chartContainer: {
        alignItems: "flex-start",
        justifyContent: "center",
        width: "100%",
    },
    countsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        gap: 12,
    },
    countItem: {
        alignItems: "center",
        flex: 1,
        paddingVertical: 8,
    },
    countLabel: {
        fontSize: 14,
        color: TEXT_SECONDARY,
        fontWeight: "400",
        marginTop: 6,
    },
    colorIndicator: {
        height: 3,
        width: 14,
        borderRadius: 1.5,
        marginTop: 8,
    },
    countValue: {
        fontSize: 16,
        color: TEXT_PRIMARY,
        fontWeight: "500",
    },
    stripLabelsContainer: {
        height: 20,
        marginTop: 8,
        width: '100%',
        position: 'relative',
    },
    stripDateLabel: {
        position: 'absolute',
        fontSize: 11,
        color: TEXT_SECONDARY,
        fontWeight: "400",
        textAlign: 'center',
    }
});
