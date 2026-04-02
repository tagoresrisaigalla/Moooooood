import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const ACCENT = "#4DB8B2";
const BG = "#0c0c0c";

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: BG,
                    borderTopColor: "#1a1a1a",
                },
                tabBarActiveTintColor: ACCENT,
                tabBarInactiveTintColor: "#888888",
            }}
        >
            <Tabs.Screen
                name="log"
                options={{
                    title: "Log",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="add-circle-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="timeline"
                options={{
                    title: "Timeline",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="stats-chart-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="monthly"
                options={{
                    title: "Monthly",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
