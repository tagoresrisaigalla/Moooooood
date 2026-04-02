import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogsProvider } from "../hooks/useLogs";

export default function RootLayout() {
  return (
    <LogsProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </LogsProvider>
  );
}
