import React, { memo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";

type EnergyLog = {
  id: string;
  energy: number;
  timestamp: string;
};

type Props = {
  logs: EnergyLog[];
};

const ACCENT = "#4DB8B2";
const TEXT_SECONDARY = "#888888";

const EnergyChart = ({ logs }: Props) => {
  const today = new Date().toISOString().split("T")[0];

  // Filter for today's logs and sort chronologically
  const todayLogs = logs
    .filter((log) => log.timestamp.split("T")[0] === today)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (todayLogs.length === 0) return null;

  // Transform for gifted-charts
  const data = todayLogs.map((log) => {
    const date = new Date(log.timestamp);
    let h = date.getHours();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    const timeLabel = `${h}${ampm}`;

    return {
      value: log.energy,
      label: timeLabel,
      dataPointText: log.energy.toString(),
    };
  });

  return (
    <View style={styles.container}>
      <LineChart
        data={data}
        height={220}
        width={Dimensions.get("window").width - 80}
        initialSpacing={20}
        spacing={40}
        thickness={1.5}
        color={ACCENT}
        hideRules={false}
        rulesColor="#333333"
        rulesType="solid"
        xAxisColor="#333333"
        yAxisColor="#333333"
        yAxisTextStyle={{ color: TEXT_SECONDARY, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: TEXT_SECONDARY, fontSize: 10, width: 60 }}
        yAxisMinValue={1}
        maxValue={5}
        noOfSections={4} // 1 to 5 scaling (1, 2, 3, 4, 5)
        stepValue={1}
        isAnimated={false}
        animateOnDataChange={false}
        hideDataPoints={false}
        dataPointsColor={ACCENT}
        dataPointsRadius={3}
        backgroundColor="#0c0c0c"
        hideOrigin={false}
        showVerticalLines={false}
        disableScroll
        pointerConfig={{
          pointerStripColor: ACCENT,
          pointerStripWidth: 1,
          pointerColor: ACCENT,
          radius: 4,
          pointerLabelComponent: () => null,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: "#0c0c0c",
    height: 250,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default memo(EnergyChart);
