import { useState, useMemo } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
} from "react-native";
import EditLogModal from "../../components/EditLogModal";
import Slider from "@react-native-community/slider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLogs } from "../../hooks/useLogs";

const ACCENT = "#4DB8B2";
const BG = "#0c0c0c";
const TEXT_PRIMARY = "#E8E8E8";
const TEXT_SECONDARY = "#888888";

export default function LogScreen() {
    const [energy, setEnergy] = useState(3);
    const insets = useSafeAreaInsets();
    const { logs, addLog, updateLog, deleteLog, isLoading } = useLogs();

    // Modal state
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingLog, setEditingLog] = useState<any | null>(null);

    const todayLogs = useMemo(() => {
        if (!logs) return [];
        const now = new Date();
        return logs
            .filter((log) => {
                const d = new Date(log.timestamp);
                return (
                    d.getFullYear() === now.getFullYear() &&
                    d.getMonth() === now.getMonth() &&
                    d.getDate() === now.getDate()
                );
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Latest first on Log tab
    }, [logs]);

    const formatTime = (timestamp: string | number) => {
        return new Date(timestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });
    };

    const handleLog = async () => {
        await addLog(energy);

        if (Platform.OS === "web") {
            window.alert(`Energy logged: ${energy}`);
        } else {
            Alert.alert("Logged", `Energy logged: ${energy}`);
        }
    };

    const openEditModal = (log: any) => {
        setEditingLog(log);
        setIsModalVisible(true);
    };

    const openPastModal = () => {
        setEditingLog(null);
        setIsModalVisible(true);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                showsVerticalScrollIndicator={false}
            >
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
                        <Text style={styles.buttonText}>Log Now</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={openPastModal} style={styles.pastLogBtn}>
                        <Text style={styles.pastLogText}>Add Past Log</Text>
                    </TouchableOpacity>

                    <EditLogModal 
                        visible={isModalVisible}
                        onClose={() => setIsModalVisible(false)}
                        log={editingLog}
                    />

                    {/* Today's Logs List */}
                    <View style={styles.logsSection}>
                        <Text style={styles.sectionTitle}>TODAY'S LOGS</Text>
                        {isLoading ? (
                            <Text style={styles.placeholderText}>Loading...</Text>
                        ) : todayLogs.length === 0 ? (
                            <Text style={styles.placeholderText}>No entries yet</Text>
                        ) : (
                            todayLogs.map((log) => (
                                <TouchableOpacity
                                    key={log.id}
                                    style={styles.logRow}
                                    onPress={() => openEditModal(log)}
                                >
                                    <Text style={styles.logTime}>{formatTime(log.timestamp)}</Text>
                                    <Text style={styles.logLevel}>Level {log.energy}</Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
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
    logsSection: {
        marginTop: 48,
        width: "100%",
    },
    sectionTitle: {
        fontSize: 10,
        color: TEXT_SECONDARY,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        marginBottom: 16,
        fontWeight: "600",
    },
    placeholderText: {
        fontSize: 14,
        color: TEXT_SECONDARY,
        fontWeight: "300",
    },
    logRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#222",
    },
    logTime: {
        fontSize: 14,
        color: TEXT_PRIMARY,
        fontWeight: "400",
    },
    logLevel: {
        fontSize: 14,
        color: TEXT_SECONDARY,
        fontWeight: "400",
    },
    pastLogBtn: {
        marginBottom: 32,
    },
    pastLogText: {
        color: ACCENT,
        fontSize: 14,
        fontWeight: "500",
    },
});
