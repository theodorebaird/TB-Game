import React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";

const STEPS = [
  {
    title: "1. The Hex Grid",
    body: "TB Game is played on a hex grid. Tap any tile to inspect it. Drag two fingers to pan, pinch to zoom. Tiles you can't see are darkened — that's fog of war.",
  },
  {
    title: "2. Units & Movement",
    body: "Tap one of your units (color-coded). White hexes are where you can move; tap to walk there. Red hexes show enemies in attack range — tap to engage.",
  },
  {
    title: "3. Combat & Retaliation",
    body: "When you attack at melee range, the defender hits back at half power (if it survives). Ranged attacks (range 2+) never trigger retaliation. Terrain gives defenders a bonus — forests +25%, ruins +20%, dunes +10%.",
  },
  {
    title: "4. Cities & Economy",
    body: "Workers can found a settlement (2 AP) on flats, ruin, or forest. Cities produce units and buildings from your Scrap, Food, Power, and Tech income. Tap a city to open its panel.",
  },
  {
    title: "5. Research",
    body: "Tap TECH to spend Tech points on upgrades. Each tier unlocks more. Faction-unique branches give you tools no one else has.",
  },
  {
    title: "6. The World Fights Back",
    body: "Radiation drifts. Dust storms move across the map. The Bloom — a sentient fungus — spreads. Each round these systems tick. Adapt.",
  },
  {
    title: "7. Diplomacy",
    body: "Tap DIPLO to propose truce, peace, or trade. Influence is the currency of words. Attacking an ally drops you to TRAITOR status and the rest of the world will remember.",
  },
  {
    title: "8. Your Warlord",
    body: "Visit The Bunker to create a Warlord. They persist across matches, gain XP and Salvage, and can be equipped with weapons, armor, relics, and companions.",
  },
  {
    title: "9. Winning",
    body: "Each faction has a unique win condition. If round 30 ends with no winner, the player with the highest Legacy Score takes it (cities + tech + units + influence).",
  },
];

export default function Tutorial() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.h1}>How to Survive the Dust</Text>
      {STEPS.map((s, i) => (
        <View key={i} style={styles.card}>
          <Text style={styles.cardTitle}>{s.title}</Text>
          <Text style={styles.cardBody}>{s.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a0f08" },
  h1: { color: "#d4b048", fontSize: 24, fontWeight: "800", marginBottom: 16, letterSpacing: 2 },
  card: { borderWidth: 1, borderColor: "#3a2515", borderRadius: 8, padding: 12, marginBottom: 8 },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 4 },
  cardBody: { color: "#dbb98b", fontSize: 13, lineHeight: 20 },
});
