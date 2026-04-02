import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Platform,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLogs } from "../hooks/useLogs";

const ACCENT = "#4DB8B2";
const BG = "#0c0c0c";
const TEXT_PRIMARY = "#E8E8E8";
const TEXT_SECONDARY = "#888888";

type EditLogModalProps = {
    visible: boolean;
    onClose: () => void;
    log: any | null; // null for "Add Past Log"
};

export default function EditLogModal({ visible, onClose, log }: EditLogModalProps) {
    const { addLog, updateLog, deleteLog } = useLogs();
    const [editEnergy, setEditEnergy] = useState(3);
    const [editDateObj, setEditDateObj] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    useEffect(() => {
        if (visible) {
            const now = new Date();
            const dateObj = log ? new Date(log.timestamp) : now;
            setEditEnergy(log ? log.energy : 3);
            setEditDateObj(dateObj);
            setShowDatePicker(false);
            setShowTimePicker(false);
        }
    }, [visible, log]);

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) setEditDateObj(selectedDate);
    };

    const handleTimeChange = (event: any, selectedTime?: Date) => {
        if (Platform.OS === 'android') setShowTimePicker(false);
        if (selectedTime) setEditDateObj(selectedTime);
    };

    const handleSave = async () => {
        try {
            const fullTimestamp = editDateObj.toISOString();
            if (log) {
                await updateLog(log.id, editEnergy, fullTimestamp);
            } else {
                await addLog(editEnergy, fullTimestamp);
            }
            onClose();
        } catch (e) {
            Alert.alert("Error", "Could not save log.");
        }
    };

    const handleDelete = async () => {
        if (log) {
            Alert.alert("Delete Log", "Are you sure you want to delete this log?", [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteLog(log.id);
                        onClose();
                    },
                },
            ]);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={() => {}}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalContent}
                >
                    <Text style={styles.modalTitle}>
                        {log ? "Edit Log" : "Add Past Log"}
                    </Text>

                    <View style={styles.modalSection}>
                        <Text style={styles.modalLabel}>Energy Level ({editEnergy})</Text>
                        <View style={styles.energyPicker}>
                            {[1, 2, 3, 4, 5].map((lvl) => (
                                <TouchableOpacity
                                    key={lvl}
                                    style={[
                                        styles.energyBtn,
                                        editEnergy === lvl && styles.energyBtnActive,
                                    ]}
                                    onPress={() => setEditEnergy(lvl)}
                                >
                                    <Text
                                        style={[
                                            styles.energyBtnText,
                                            editEnergy === lvl && styles.energyBtnTextActive,
                                        ]}
                                    >
                                        {lvl}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.modalSection}>
                        <Text style={styles.modalLabel}>Date</Text>
                        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(prev => !prev)} activeOpacity={0.8}>
                            <Text style={styles.inputText}>
                                {editDateObj.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                            </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={editDateObj}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleDateChange}
                                textColor={TEXT_PRIMARY}
                                themeVariant="dark"
                            />
                        )}
                    </View>

                    <View style={styles.modalSection}>
                        <Text style={styles.modalLabel}>Time</Text>
                        <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(prev => !prev)} activeOpacity={0.8}>
                            <Text style={styles.inputText}>
                                {editDateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </Text>
                        </TouchableOpacity>
                        {showTimePicker && (
                            <DateTimePicker
                                value={editDateObj}
                                mode="time"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleTimeChange}
                                textColor={TEXT_PRIMARY}
                                themeVariant="dark"
                            />
                        )}
                    </View>

                    <View style={styles.modalActionsContainer}>
                        <View style={styles.primaryActionsRow}>
                            <TouchableOpacity
                                onPress={onClose}
                                style={[styles.actionBtn, styles.cancelBtn]}
                            >
                                <Text style={[styles.actionBtnText, styles.cancelBtnText]}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleSave}
                                style={[styles.actionBtn, styles.saveBtn]}
                            >
                                <Text style={[styles.actionBtnText, styles.saveBtnText]}>Save</Text>
                            </TouchableOpacity>
                        </View>

                        {log && (
                            <TouchableOpacity
                                onPress={handleDelete}
                                style={[styles.actionBtn, styles.deleteBtn]}
                            >
                                <Text style={[styles.actionBtnText, styles.deleteBtnText]}>Delete</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.85)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        backgroundColor: "#111",
        width: "100%",
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: "#222",
    },
    modalTitle: {
        fontSize: 18,
        color: TEXT_PRIMARY,
        fontWeight: "600",
        marginBottom: 24,
        textAlign: "center",
    },
    modalSection: {
        marginBottom: 16,
    },
    modalLabel: {
        fontSize: 14,
        color: TEXT_SECONDARY,
        marginBottom: 8,
        fontWeight: "400",
    },
    energyPicker: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    energyBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#1a1a1a",
        justifyContent: "center",
        alignItems: "center",
    },
    energyBtnActive: {
        backgroundColor: ACCENT,
    },
    energyBtnText: {
        color: TEXT_PRIMARY,
        fontSize: 16,
        fontWeight: "500",
    },
    energyBtnTextActive: {
        color: BG,
        fontWeight: "bold",
    },
    input: {
        backgroundColor: "#1a1a1a",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        justifyContent: "center",
    },
    inputText: {
        color: TEXT_PRIMARY,
        fontSize: 16,
        fontWeight: "500",
    },
    modalActionsContainer: {
        marginTop: 24,
        gap: 16,
    },
    primaryActionsRow: {
        flexDirection: "row",
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    actionBtnText: {
        fontSize: 14,
    },
    cancelBtn: {
        backgroundColor: "transparent",
    },
    cancelBtnText: {
        color: TEXT_SECONDARY,
    },
    deleteBtn: {
        backgroundColor: "transparent",
    },
    deleteBtnText: {
        color: TEXT_SECONDARY,
        fontWeight: "500",
    },
    saveBtn: {
        backgroundColor: ACCENT,
    },
    saveBtnText: {
        color: BG,
        fontWeight: "600",
    },
});
