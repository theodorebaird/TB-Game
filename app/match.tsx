import React, { useState, useEffect } from "react";
import { View, StyleSheet, Modal, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { MapView } from "@render/MapView";
import { HudOverlay } from "@render/HudOverlay";
import { useMatchStore } from "@state/matchStore";
import { useMetaStore } from "@state/metaStore";
import { availableTech, TECH } from "@engine/tech";
import { BUILDINGS } from "@engine/cities";
import { UNITS } from "@engine/units";
import { FACTIONS } from "@engine/factions";
import { currentPlayer } from "@engine/match";
import { DIPLO_ACTIONS, setDiplo, getDiplo } from "@engine/diplomacy";
import { saveMatch, clearMatch } from "@state/persistence";

export default function MatchScreen() {
  const router = useRouter();
  const match = useMatchStore((s) => s.match);
  const research = useMatchStore((s) => s.research);
  const queueUnit = useMatchStore((s) => s.queueUnit);
  const queueBuilding = useMatchStore((s) => s.queueBuilding);
  const endMatchMeta = useMetaStore((s) => s.endMatch);

  const [techOpen, setTechOpen] = useState(false);
  const [diploOpen, setDiploOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState<string | null>(null);

  // Autosave on every change
  useEffect(() => {
    if (match) saveMatch(match);
  }, [match]);

  // Trigger meta-progression on win
  useEffect(() => {
    if (match?.winner) {
      const human = match.players[0];
      const won = match.winner === human.id;
      const score = Object.values(match.cities).filter((c) => c.owner === human.id).length * 10;
      endMatchMeta(won, score);
      clearMatch();
    }
  }, [match?.winner, endMatchMeta]);

  if (!match) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>No active match.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace("/")}>
          <Text style={styles.btnText}>Back to Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cur = currentPlayer(match);
  const fac = FACTIONS[cur.faction];

  return (
    <View style={styles.container}>
      <MapView />
      <HudOverlay
        onOpenDiplo={() => setDiploOpen(true)}
        onOpenTech={() => setTechOpen(true)}
        onOpenCity={(id) => setCityOpen(id)}
      />

      {/* TECH MODAL */}
      <Modal visible={techOpen} animationType="slide" transparent>
        <View style={styles.modalRoot}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Research</Text>
            {cur.queuedResearch && (
              <Text style={styles.queuedText}>Queued: {cur.queuedResearch}</Text>
            )}
            <ScrollView style={{ maxHeight: 400 }}>
              {availableTech(cur).map((k) => {
                const t = TECH[k];
                const canAfford = cur.resources.tech >= t.cost;
                return (
                  <TouchableOpacity
                    key={k}
                    disabled={!canAfford}
                    style={[styles.techRow, !canAfford && { opacity: 0.4 }]}
                    onPress={() => {
                      if (research(k)) setTechOpen(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.techName}>{k} <Text style={styles.techTier}>T{t.tier}</Text></Text>
                      <Text style={styles.techDesc}>{t.desc}</Text>
                    </View>
                    <Text style={styles.techCost}>{t.cost}⚙</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setTechOpen(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DIPLO MODAL */}
      <Modal visible={diploOpen} animationType="slide" transparent>
        <View style={styles.modalRoot}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Diplomacy</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {match.players.filter((p) => p.id !== cur.id && !p.eliminated).map((other) => {
                const state = getDiplo(cur, other);
                const trust = cur.trust[other.id] ?? 0;
                return (
                  <View key={other.id} style={styles.diploRow}>
                    <View style={[styles.factionDot, { backgroundColor: other.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.techName}>{other.name} ({FACTIONS[other.faction].name})</Text>
                      <Text style={styles.techDesc}>State: {state} · Trust: {trust}</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 4 }}>
                      <TouchableOpacity
                        style={styles.smallBtn}
                        onPress={() => {
                          if (cur.resources.influence >= 5) {
                            cur.resources.influence -= 5;
                            setDiplo(cur, other, "truce");
                          }
                        }}
                      >
                        <Text style={styles.smallBtnText}>Truce 5⚜</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.smallBtn, { backgroundColor: "#b94a4a" }]}
                        onPress={() => setDiplo(cur, other, "war")}
                      >
                        <Text style={styles.smallBtnText}>War</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setDiploOpen(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CITY MODAL */}
      <Modal visible={!!cityOpen} animationType="slide" transparent>
        <View style={styles.modalRoot}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>City</Text>
            {cityOpen && match.cities[cityOpen] && (
              <ScrollView style={{ maxHeight: 400 }}>
                <Text style={styles.sectionLbl}>Build Unit</Text>
                {Object.entries(UNITS)
                  .filter(([, def]) => def.faction === "any" || def.faction === cur.faction)
                  .map(([k, def]) => (
                    <TouchableOpacity
                      key={k}
                      style={styles.techRow}
                      onPress={() => {
                        if (cityOpen && queueUnit(cityOpen, k)) setCityOpen(null);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.techName}>{k}</Text>
                        <Text style={styles.techDesc}>HP {def.hpMax} · ATK {def.atk} · DEF {def.def}</Text>
                      </View>
                      <Text style={styles.techCost}>{Object.entries(def.cost).map(([r, v]) => `${v}${r[0]}`).join(" ")}</Text>
                    </TouchableOpacity>
                  ))}
                <Text style={styles.sectionLbl}>Build Building</Text>
                {Object.entries(BUILDINGS).map(([k, def]) => (
                  <TouchableOpacity
                    key={k}
                    style={styles.techRow}
                    onPress={() => {
                      if (cityOpen && queueBuilding(cityOpen, k)) setCityOpen(null);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.techName}>{k}</Text>
                      <Text style={styles.techDesc}>{Object.entries(def.cost as Record<string, number>).map(([r, v]) => `${v} ${r}`).join(", ")}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setCityOpen(null)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {match.winner && (
        <TouchableOpacity style={styles.returnBtn} onPress={() => router.replace("/")}>
          <Text style={styles.returnText}>Return to Menu</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a0f08" },
  empty: { color: "#dbb98b", textAlign: "center", marginTop: 100 },
  btn: { marginTop: 20, marginHorizontal: 40, paddingVertical: 14, backgroundColor: "#d4b048", borderRadius: 8, alignItems: "center" },
  btnText: { color: "#1a0f08", fontWeight: "700" },
  modalRoot: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#1a0f08", borderTopWidth: 2, borderColor: "#d4b048", padding: 16, maxHeight: "70%" },
  modalTitle: { color: "#d4b048", fontSize: 20, fontWeight: "800", marginBottom: 8, letterSpacing: 2 },
  queuedText: { color: "#7a6dbf", marginBottom: 8 },
  techRow: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderColor: "#3a2515", alignItems: "center", gap: 8 },
  techName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  techTier: { color: "#7a6b5d", fontSize: 11 },
  techDesc: { color: "#dbb98b", fontSize: 11, marginTop: 2 },
  techCost: { color: "#7a6dbf", fontSize: 14, fontWeight: "700" },
  closeBtn: { marginTop: 12, paddingVertical: 12, backgroundColor: "#3a2515", borderRadius: 6, alignItems: "center" },
  closeText: { color: "#dbb98b" },
  diploRow: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderColor: "#3a2515", alignItems: "center", gap: 8 },
  factionDot: { width: 14, height: 14, borderRadius: 7 },
  smallBtn: { backgroundColor: "#3a2515", paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4 },
  smallBtnText: { color: "#dbb98b", fontSize: 11 },
  sectionLbl: { color: "#d4b048", fontWeight: "700", marginTop: 12, marginBottom: 4 },
  returnBtn: { position: "absolute", bottom: 80, left: 24, right: 24, backgroundColor: "#d4b048", paddingVertical: 16, borderRadius: 8, alignItems: "center" },
  returnText: { color: "#1a0f08", fontWeight: "800", fontSize: 16 },
});
