import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "energy_logs";

export type EnergyLog = {
    id: string;
    energy: number;
    timestamp: string;
};

interface LogsContextType {
    logs: EnergyLog[];
    addLog: (energy: number, timestamp?: string) => Promise<void>;
    updateLog: (id: string, energy: number, timestamp: string) => Promise<void>;
    deleteLog: (id: string) => Promise<void>;
    isLoading: boolean;
}

const LogsContext = createContext<LogsContextType | undefined>(undefined);

export function LogsProvider({ children }: { children: ReactNode }) {
    const [logs, setLogs] = useState<EnergyLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadLogs = async () => {
            try {
                const raw = await AsyncStorage.getItem(STORAGE_KEY);
                if (raw) {
                    setLogs(JSON.parse(raw));
                }
            } catch (error) {
                console.error("Failed to load logs:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadLogs();
    }, []);

    const addLog = async (energy: number, timestamp?: string) => {
        const entry: EnergyLog = {
            id: Date.now().toString(),
            energy,
            timestamp: timestamp || new Date().toISOString(),
        };
        const updated = [entry, ...logs].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setLogs(updated);
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error("Failed to save log:", error);
        }
    };

    const updateLog = async (id: string, energy: number, timestamp: string) => {
        const updated = logs
            .map((l) => (l.id === id ? { ...l, energy, timestamp } : l))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setLogs(updated);
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error("Failed to update log:", error);
        }
    };

    const deleteLog = async (id: string) => {
        const updated = logs.filter((l) => l.id !== id);
        setLogs(updated);
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error("Failed to delete log:", error);
        }
    };

    return (
        <LogsContext.Provider value={{ logs, addLog, updateLog, deleteLog, isLoading }}>
            {children}
        </LogsContext.Provider>
    );
}

export function useLogs() {
    const context = useContext(LogsContext);
    if (context === undefined) {
        throw new Error("useLogs must be used within a LogsProvider");
    }
    return context;
}
