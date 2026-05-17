import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { FACTIONS, FACTION_LIST } from "@engine/factions";
import { useMatchStore } from "@state/matchStore";
import { Faction } from "@engine/types";

export default function NewGame() {
  const router = useRouter();
  const [picked, setPicked] = useState<Faction>("scrappers");
  const [opponents, setOpponents] = useState(2);
  const startMatch = useMatchStore((s) => s.startMatch);

  function start() {
    const others = FACTION_LIST.filter((f) => f !== picked);
    // shuffle + take N
    const ai = others.sort(() => Math.random() - 0.5).slice(0, opponents);
    startMatch([picked, ...ai]);
    router.replace("/match");
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <Text style={styles.section}>Pick your faction</Text>
      {FACTION_LIST.map((f) => {
        const def = FACTIONS[f];
        const sel = picked === f;
        return (
          <TouchableOpacity
            key={f}
            onPress={() => setPicked(f)}
            style={[styles.factionCard, sel && { borderColor: def.color, borderWidth: 2 }]}
          >
            <View style={[styles.factionDot, { backgroundColor: def.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.factionName}>{def.name}</Text>
              <Text style={styles.factionMotto}>"{def.motto}"</Text>
              <Text style={styles.factionLine}>Passive: {def.passive}</Text>
              <Text style={styles.factionLine}>Win: {def.winCondition}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      <Text style={styles.section}>Opponents</Text>
      <View style={styles.row}>
        {[1, 2, 3, 4].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => setOpponents(n)}
            style={[styles.pill, opponents === n && styles.pillActive]}
          >
            <Text style={[styles.pillText, opponents === n && styles.pillTextActive]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.startBtn} onPress={start}>
        <Text style={styles.startText}>BEGIN</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a0f08", padding: 16 },
  section: { color: "#d4b048", fontSize: 18, fontWeight: "700", marginTop: 16, marginBottom: 8, letterSpacing: 2 },
  factionCard: { flexDirection: "row", borderWidth: 1, borderColor: "#3a2515", borderRadius: 8, padding: 12, marginBottom: 8, alignItems: "center", gap: 12 },
  factionDot: { width: 18, height: 18, borderRadius: 9 },
  factionName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  factionMotto: { color: "#9a8a75", fontSize: 12, fontStyle: "italic", marginTop: 2 },
  factionLine: { color: "#dbb98b", fontSize: 11, marginTop: 4 },
  row: { flexDirection: "row", gap: 8 },
  pill: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#3a2515" },
  pillActive: { backgroundColor: "#d4b048", borderColor: "#d4b048" },
  pillText: { color: "#dbb98b", fontSize: 16, fontWeight: "700" },
  pillTextActive: { color: "#1a0f08" },
  startBtn: { marginTop: 32, backgroundColor: "#d4b048", paddingVertical: 18, borderRadius: 8, alignItems: "center" },
  startText: { color: "#1a0f08", fontSize: 20, fontWeight: "900", letterSpacing: 4 },
});
