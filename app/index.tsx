import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  SafeAreaView,
  FlatList,
} from "react-native";
import Slider from "@react-native-community/slider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EnergyChart from "./EnergyChart";

const ACCENT = "#4DB8B2";
const BG = "#0c0c0c";
const TEXT_PRIMARY = "#E8E8E8";
const TEXT_SECONDARY = "#888888";
const STORAGE_KEY = "energy_logs";

type EnergyLog = {
  id: string;
  energy: number;
  timestamp: string;
};

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

const isToday = (isoString: string) => {
  const d = new Date(isoString);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

export default function Index() {
  const [energy, setEnergy] = useState(3);
  const [logs, setLogs] = useState<EnergyLog[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setLogs(JSON.parse(raw));
    });
  }, []);

  const handleLog = async () => {
    const entry: EnergyLog = {
      id: Date.now().toString(),
      energy,
      timestamp: new Date().toISOString(),
    };
    const updated = [entry, ...logs];
    setLogs(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (Platform.OS === "web") {
      window.alert(`Energy logged: ${energy}`);
    } else {
      Alert.alert("Logged", `Energy logged: ${energy}`);
    }
  };

  const renderItem = ({ item }: { item: EnergyLog }) => (
    <View testID={`log-entry-${item.id}`} style={styles.logRow}>
      <Text style={styles.logText}>
        Energy {item.energy} — {formatTime(item.timestamp)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.top}>
        <Text testID="energy-label" style={styles.label}>
          Energy
        </Text>

        <Text testID="energy-value" style={styles.value}>
          {energy}
        </Text>

        <View style={styles.sliderContainer}>
          <Slider
            testID="energy-slider"
            style={styles.slider}
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={energy}
            onValueChange={(val: number) => setEnergy(val)}
            minimumTrackTintColor={ACCENT}
            maximumTrackTintColor="#333333"
            thumbTintColor={ACCENT}
          />
          <View style={styles.rangeLabels}>
            <Text style={styles.rangeText}>1</Text>
            <Text style={styles.rangeText}>5</Text>
          </View>
        </View>

        <TouchableOpacity
          testID="log-energy-btn"
          style={styles.button}
          onPress={handleLog}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Log Energy</Text>
        </TouchableOpacity>
      </View>

      <View testID="log-list-container" style={styles.listSection}>
        {logs.length > 0 && (
          <Text testID="log-list-header" style={styles.listHeader}>
            Today
          </Text>
        )}
        <FlatList
          testID="log-list"
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<EnergyChart logs={logs.filter(l => isToday(l.timestamp))} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  top: {
    paddingTop: 80,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  label: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  value: {
    fontSize: 48,
    fontWeight: "300",
    color: TEXT_PRIMARY,
    marginBottom: 32,
  },
  sliderContainer: {
    width: "100%",
    marginBottom: 48,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: 4,
  },
  rangeText: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  button: {
    backgroundColor: ACCENT,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 8,
    marginBottom: 32,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: BG,
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 40,
  },
  listHeader: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  logRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1a1a1a",
  },
  logText: {
    fontSize: 14,
    color: TEXT_PRIMARY,
  },
});
