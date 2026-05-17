import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { useMetaStore } from "@state/metaStore";

export default function MainMenu() {
  const router = useRouter();
  const hero = useMetaStore((s) => s.hero);

  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.title}>TB GAME</Text>
        <Text style={styles.subtitle}>Tribes of the Endless Dust</Text>
      </View>

      <View style={styles.menu}>
        <MenuButton label="New Game" onPress={() => router.push("/new-game")} primary />
        <MenuButton label="Tutorial" onPress={() => router.push("/tutorial")} />
        <MenuButton label="The Bunker" onPress={() => router.push("/bunker")} />
      </View>

      <View style={styles.heroBar}>
        {hero ? (
          <Text style={styles.heroText}>
            {hero.name} · Lvl {hero.level} · {hero.salvage} Salvage
          </Text>
        ) : (
          <Text style={styles.heroText}>No Warlord yet. Visit The Bunker to create one.</Text>
        )}
      </View>
    </View>
  );
}

function MenuButton({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.btn, primary && styles.btnPrimary]}
      activeOpacity={0.8}
    >
      <Text style={[styles.btnText, primary && styles.btnTextPrimary]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a0f08", paddingTop: 80, paddingHorizontal: 24, justifyContent: "space-between" },
  logoBox: { alignItems: "center", marginTop: 40 },
  title: { color: "#d4b048", fontSize: 56, fontWeight: "900", letterSpacing: 6 },
  subtitle: { color: "#7a6b5d", fontSize: 14, letterSpacing: 4, marginTop: 6 },
  menu: { gap: 12, marginBottom: 40 },
  btn: { borderWidth: 1, borderColor: "#3a2515", paddingVertical: 18, borderRadius: 8, alignItems: "center" },
  btnPrimary: { backgroundColor: "#d4b048", borderColor: "#d4b048" },
  btnText: { color: "#dbb98b", fontSize: 18, fontWeight: "600", letterSpacing: 2 },
  btnTextPrimary: { color: "#1a0f08", fontWeight: "800" },
  heroBar: { paddingVertical: 16, alignItems: "center" },
  heroText: { color: "#7a6b5d", fontSize: 13 },
});
