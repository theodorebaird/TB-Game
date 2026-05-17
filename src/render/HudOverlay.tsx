import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useMatchStore } from "@state/matchStore";
import { currentPlayer } from "@engine/match";
import { FACTIONS } from "@engine/factions";

export function HudOverlay({ onOpenDiplo, onOpenTech, onOpenCity }: { onOpenDiplo: () => void; onOpenTech: () => void; onOpenCity: (cityId: string) => void }) {
  const match = useMatchStore((s) => s.match);
  const endTurn = useMatchStore((s) => s.endTurn);
  const selectedUnitId = useMatchStore((s) => s.selectedUnitId);
  const foundCity = useMatchStore((s) => s.foundCity);

  if (!match) return null;
  const cur = currentPlayer(match);
  const fac = FACTIONS[cur.faction];

  const selectedUnit = selectedUnitId ? match.units[selectedUnitId] : null;
  const selectedTile = selectedUnit ? match.tiles[selectedUnit.hex.q][selectedUnit.hex.r] : null;
  const selectedCity = selectedTile?.cityId ? match.cities[selectedTile.cityId] : null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* TOP HUD */}
      <View style={styles.topBar}>
        <View style={[styles.factionTag, { backgroundColor: fac.color }]}>
          <Text style={styles.factionTagText}>{fac.name}</Text>
        </View>
        <Text style={styles.roundText}>Round {match.round}/{match.maxRounds}</Text>
        <Text style={styles.apText}>AP {cur.ap}/{cur.apMax}</Text>
      </View>
      <View style={styles.resBar}>
        <ResChip label="Scrap" v={cur.resources.scrap} color="#c97b3a" />
        <ResChip label="Food" v={cur.resources.food} color="#5fa86b" />
        <ResChip label="Power" v={cur.resources.power} color="#d4b048" />
        <ResChip label="Tech" v={cur.resources.tech} color="#7a6dbf" />
        <ResChip label="Inf" v={cur.resources.influence} color="#b94a4a" />
      </View>

      {/* CONTEXT PANEL */}
      <View style={styles.contextPanel}>
        {selectedUnit ? (
          <View>
            <Text style={styles.contextTitle}>{selectedUnit.type}</Text>
            <Text style={styles.contextLine}>HP {selectedUnit.hp}/{selectedUnit.hpMax} · ATK {selectedUnit.atk} · DEF {selectedUnit.def} · Range {selectedUnit.range} · Move {selectedUnit.movement}</Text>
            <Text style={styles.contextLine}>XP {selectedUnit.xp} · Vet {selectedUnit.veterancy} · AP {selectedUnit.ap}</Text>
            {(selectedUnit.abilities.includes("foundCity") || selectedUnit.abilities.includes("foundCamp")) && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => foundCity()}>
                <Text style={styles.actionText}>Found Settlement (2 AP)</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : selectedCity ? (
          <View>
            <Text style={styles.contextTitle}>City · pop {selectedCity.pop}</Text>
            <Text style={styles.contextLine}>HP {selectedCity.hp}/{selectedCity.hpMax} · Buildings {selectedCity.buildings.length}</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onOpenCity(selectedCity.id)}>
              <Text style={styles.actionText}>Open city panel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.contextHint}>Tap a unit or city. Drag to pan, pinch to zoom.</Text>
        )}
      </View>

      {/* LOG TAIL */}
      <ScrollView style={styles.log} horizontal>
        <Text style={styles.logText}>{match.log.slice(-3).join("  ·  ")}</Text>
      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtn} onPress={onOpenTech}>
          <Text style={styles.bottomBtnText}>Tech</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn} onPress={onOpenDiplo}>
          <Text style={styles.bottomBtnText}>Diplo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.bottomBtn, styles.endTurnBtn]} onPress={endTurn}>
          <Text style={[styles.bottomBtnText, { color: "#1a0f08", fontWeight: "700" }]}>End Turn</Text>
        </TouchableOpacity>
      </View>

      {match.winner && (
        <View style={styles.winnerOverlay} pointerEvents="auto">
          <Text style={styles.winnerTitle}>{match.players.find((p) => p.id === match.winner)?.name} wins!</Text>
        </View>
      )}
    </View>
  );
}

function ResChip({ label, v, color }: { label: string; v: number; color: string }) {
  return (
    <View style={[styles.resChip, { borderColor: color }]}>
      <Text style={styles.resChipText}>
        <Text style={{ color }}>{label}</Text> {Math.round(v)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingTop: 48, paddingBottom: 4 },
  factionTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  factionTagText: { color: "#1a0f08", fontSize: 13, fontWeight: "700" },
  roundText: { color: "#dbb98b", fontSize: 13 },
  apText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  resBar: { flexDirection: "row", gap: 6, paddingHorizontal: 12, paddingVertical: 4, flexWrap: "wrap" },
  resChip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  resChipText: { color: "#fff", fontSize: 12 },
  contextPanel: { position: "absolute", left: 0, right: 0, bottom: 100, backgroundColor: "rgba(26,15,8,0.85)", paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderColor: "#3a2515" },
  contextTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 2 },
  contextLine: { color: "#dbb98b", fontSize: 12, marginTop: 2 },
  contextHint: { color: "#7a6b5d", fontSize: 12, fontStyle: "italic" },
  actionBtn: { marginTop: 8, backgroundColor: "#c97b3a", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, alignSelf: "flex-start" },
  actionText: { color: "#1a0f08", fontWeight: "700" },
  log: { position: "absolute", left: 12, right: 12, bottom: 78, maxHeight: 20 },
  logText: { color: "#9a8a75", fontSize: 11 },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", padding: 12, gap: 8, backgroundColor: "rgba(26,15,8,0.9)" },
  bottomBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: "center", backgroundColor: "#3a2515" },
  bottomBtnText: { color: "#dbb98b", fontWeight: "600", fontSize: 14 },
  endTurnBtn: { backgroundColor: "#d4b048" },
  winnerOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" },
  winnerTitle: { color: "#d4b048", fontSize: 28, fontWeight: "800" },
});
