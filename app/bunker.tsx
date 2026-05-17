import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { useMetaStore } from "@state/metaStore";
import { HERO_ARCHETYPES, HeroArchetype } from "@engine/heroes";
import itemsJson from "@data/items.json";

const ITEMS = itemsJson as Record<string, { slot: string; tier: number; cost: number; desc: string }>;

export default function Bunker() {
  const hero = useMetaStore((s) => s.hero);
  const createHero = useMetaStore((s) => s.createHero);
  const equip = useMetaStore((s) => s.equip);
  const spend = useMetaStore((s) => s.spendSalvage);
  const [name, setName] = useState("Dust");
  const [arch, setArch] = useState<HeroArchetype>("reaver");

  if (!hero) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.h1}>Forge a Warlord</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Name" placeholderTextColor="#7a6b5d" />
        <Text style={styles.h2}>Pick Archetype</Text>
        {Object.values(HERO_ARCHETYPES).map((a) => (
          <TouchableOpacity
            key={a.id}
            onPress={() => setArch(a.id)}
            style={[styles.card, arch === a.id && styles.cardActive]}
          >
            <Text style={styles.cardTitle}>{a.name}</Text>
            <Text style={styles.cardFlavor}>{a.flavor}</Text>
            <Text style={styles.cardStats}>HP {a.baseStats.hp} · ATK {a.baseStats.atk} · DEF {a.baseStats.def}</Text>
            <Text style={styles.cardLine}>Signature: {a.signatureDesc}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.primary} onPress={() => createHero(arch, name)}>
          <Text style={styles.primaryText}>FORGE</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.h1}>{hero.name}</Text>
      <Text style={styles.sub}>
        {HERO_ARCHETYPES[hero.archetype].name} · Lvl {hero.level} · {hero.salvage} Salvage
      </Text>
      <Text style={styles.statLine}>HP {hero.stats.hp} · ATK {hero.stats.atk} · DEF {hero.stats.def}</Text>
      <Text style={styles.statLine}>Matches {hero.matchesPlayed} · Wins {hero.matchesWon}</Text>

      <Text style={styles.h2}>Workbench</Text>
      {(["weapon", "armor", "relic", "companion"] as const).map((slot) => (
        <View key={slot} style={styles.slotBlock}>
          <Text style={styles.slotLabel}>
            {slot}: {hero.equipped[slot] ?? "—"}
          </Text>
          <ScrollView horizontal>
            {Object.entries(ITEMS)
              .filter(([, def]) => def.slot === slot)
              .map(([k, def]) => {
                const owned = hero.equipped[slot] === k;
                return (
                  <TouchableOpacity
                    key={k}
                    onPress={() => {
                      if (owned) return equip(slot, undefined);
                      if (hero.salvage >= def.cost) {
                        if (spend(def.cost)) equip(slot, k);
                      } else {
                        equip(slot, k); // free preview if owned — for MVP: allow equip if affordable only
                      }
                    }}
                    style={[styles.item, owned && { borderColor: "#d4b048", borderWidth: 2 }]}
                  >
                    <Text style={styles.itemName}>{k}</Text>
                    <Text style={styles.itemTier}>T{def.tier} · {def.cost}</Text>
                    <Text style={styles.itemDesc}>{def.desc}</Text>
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a0f08" },
  h1: { color: "#d4b048", fontSize: 28, fontWeight: "800", letterSpacing: 2 },
  h2: { color: "#d4b048", fontSize: 18, fontWeight: "700", marginTop: 20, marginBottom: 8 },
  sub: { color: "#dbb98b", fontSize: 14, marginTop: 4 },
  statLine: { color: "#9a8a75", fontSize: 12, marginTop: 4 },
  input: { borderWidth: 1, borderColor: "#3a2515", color: "#fff", padding: 10, borderRadius: 6, marginVertical: 12 },
  card: { borderWidth: 1, borderColor: "#3a2515", borderRadius: 8, padding: 12, marginBottom: 8 },
  cardActive: { borderColor: "#d4b048", borderWidth: 2 },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cardFlavor: { color: "#9a8a75", fontStyle: "italic", fontSize: 12, marginTop: 2 },
  cardStats: { color: "#dbb98b", fontSize: 12, marginTop: 4 },
  cardLine: { color: "#7a6dbf", fontSize: 11, marginTop: 4 },
  primary: { backgroundColor: "#d4b048", paddingVertical: 16, alignItems: "center", borderRadius: 8, marginTop: 20 },
  primaryText: { color: "#1a0f08", fontWeight: "800", letterSpacing: 4 },
  slotBlock: { marginBottom: 12 },
  slotLabel: { color: "#dbb98b", marginBottom: 4, textTransform: "capitalize" },
  item: { borderWidth: 1, borderColor: "#3a2515", borderRadius: 6, padding: 10, marginRight: 8, minWidth: 140 },
  itemName: { color: "#fff", fontWeight: "600", fontSize: 13 },
  itemTier: { color: "#7a6dbf", fontSize: 11, marginTop: 2 },
  itemDesc: { color: "#9a8a75", fontSize: 10, marginTop: 4 },
});
