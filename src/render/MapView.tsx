import React, { useMemo, useCallback } from "react";
import { View, useWindowDimensions } from "react-native";
import { Canvas, Path, Skia, Group, Text as SkText, useFont, Circle } from "@shopify/react-native-skia";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { useSharedValue, useDerivedValue, runOnJS } from "react-native-reanimated";
import { useMatchStore } from "@state/matchStore";
import { TERRAIN } from "@engine/terrain";
import { hexPolygonPath, getHexCenter } from "./hexGeometry";
import { pixelToHex } from "@engine/hex";
import { Hex } from "@engine/types";

const HEX_SIZE = 28;

export function MapView() {
  const { width: winW, height: winH } = useWindowDimensions();
  const canvasH = winH * 0.62;
  const match = useMatchStore((s) => s.match);
  const selectedUnitId = useMatchStore((s) => s.selectedUnitId);
  const highlightedMoves = useMatchStore((s) => s.highlightedMoves);
  const highlightedAttacks = useMatchStore((s) => s.highlightedAttacks);
  const selectUnit = useMatchStore((s) => s.selectUnit);
  const moveSelected = useMatchStore((s) => s.moveSelected);
  const attackSelected = useMatchStore((s) => s.attackSelected);

  const panX = useSharedValue(winW / 2 - HEX_SIZE * 6);
  const panY = useSharedValue(canvasH / 2 - HEX_SIZE * 8);
  const scale = useSharedValue(1);
  const lastPanX = useSharedValue(panX.value);
  const lastPanY = useSharedValue(panY.value);
  const lastScale = useSharedValue(1);

  const offsetX = useDerivedValue(() => panX.value);
  const offsetY = useDerivedValue(() => panY.value);

  const handleTap = useCallback(
    (sx: number, sy: number) => {
      if (!match) return;
      const lx = (sx - panX.value) / scale.value;
      const ly = (sy - panY.value) / scale.value;
      const h = pixelToHex(lx, ly, HEX_SIZE);
      if (h.q < 0 || h.q >= match.width || h.r < 0 || h.r >= match.height) return;
      const tile = match.tiles[h.q][h.r];
      // Attack
      if (selectedUnitId && highlightedAttacks.some((a) => a.q === h.q && a.r === h.r)) {
        attackSelected(h);
        return;
      }
      // Move
      if (selectedUnitId && highlightedMoves.some((a) => a.q === h.q && a.r === h.r)) {
        moveSelected(h);
        return;
      }
      // Select
      if (tile.unitId) {
        selectUnit(tile.unitId);
      } else {
        selectUnit(null);
      }
    },
    [match, selectedUnitId, highlightedMoves, highlightedAttacks, selectUnit, moveSelected, attackSelected, panX, panY, scale]
  );

  const tap = Gesture.Tap().onEnd((e) => {
    runOnJS(handleTap)(e.x, e.y);
  });
  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onStart(() => {
      lastPanX.value = panX.value;
      lastPanY.value = panY.value;
    })
    .onUpdate((e) => {
      panX.value = lastPanX.value + e.translationX;
      panY.value = lastPanY.value + e.translationY;
    });
  const pinch = Gesture.Pinch()
    .onStart(() => {
      lastScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.max(0.5, Math.min(2.5, lastScale.value * e.scale));
    });
  const composed = Gesture.Simultaneous(pinch, Gesture.Exclusive(pan, tap));

  const tilePaths = useMemo(() => {
    if (!match) return [];
    const out: { key: string; path: string; fill: string; stroke?: string; opacity: number }[] = [];
    const human = match.players[0];
    for (let q = 0; q < match.width; q++) {
      for (let r = 0; r < match.height; r++) {
        const tile = match.tiles[q][r];
        const visible = tile.visibility[human.id];
        const c = getHexCenter({ q, r }, HEX_SIZE);
        const base = TERRAIN[tile.terrain].color;
        let fill = base;
        if (tile.bloom >= 1) fill = mixColor(base, "#5fa86b", tile.bloom / 3);
        if (tile.radiation >= 1) fill = mixColor(fill, "#aaff44", tile.radiation / 3);
        if (tile.inStorm) fill = mixColor(fill, "#444", 0.4);
        out.push({
          key: `${q},${r}`,
          path: hexPolygonPath(c.x, c.y, HEX_SIZE),
          fill,
          opacity: visible ? 1 : 0.35,
        });
      }
    }
    return out;
  }, [match]);

  if (!match) return null;

  return (
    <View style={{ width: winW, height: canvasH, backgroundColor: "#1a0f08" }}>
      <GestureDetector gesture={composed}>
        <Animated.View style={{ width: winW, height: canvasH }}>
          <Canvas style={{ width: winW, height: canvasH }}>
            <Group transform={[{ translateX: panX.value }, { translateY: panY.value }, { scale: scale.value }]}>
              {tilePaths.map((t) => (
                <Path key={t.key} path={Skia.Path.MakeFromSVGString(t.path)!} color={t.fill} opacity={t.opacity} />
              ))}
              {/* Move/attack highlights */}
              {highlightedMoves.map((h) => {
                const c = getHexCenter(h, HEX_SIZE);
                return (
                  <Path
                    key={`mv-${h.q},${h.r}`}
                    path={Skia.Path.MakeFromSVGString(hexPolygonPath(c.x, c.y, HEX_SIZE - 2))!}
                    color="#ffffff"
                    opacity={0.18}
                  />
                );
              })}
              {highlightedAttacks.map((h) => {
                const c = getHexCenter(h, HEX_SIZE);
                return (
                  <Path
                    key={`at-${h.q},${h.r}`}
                    path={Skia.Path.MakeFromSVGString(hexPolygonPath(c.x, c.y, HEX_SIZE - 2))!}
                    color="#ff3030"
                    opacity={0.35}
                  />
                );
              })}
              {/* Cities */}
              {Object.values(match.cities).map((city) => {
                const c = getHexCenter(city.hex, HEX_SIZE);
                const owner = match.players.find((p) => p.id === city.owner);
                return (
                  <Group key={city.id}>
                    <Circle cx={c.x} cy={c.y} r={HEX_SIZE * 0.55} color={owner?.color ?? "#fff"} opacity={0.85} />
                    <Circle cx={c.x} cy={c.y} r={HEX_SIZE * 0.3} color="#1a0f08" />
                  </Group>
                );
              })}
              {/* Units */}
              {Object.values(match.units).map((u) => {
                const c = getHexCenter(u.hex, HEX_SIZE);
                const owner = match.players.find((p) => p.id === u.owner);
                const selected = u.id === selectedUnitId;
                return (
                  <Group key={u.id}>
                    <Circle cx={c.x} cy={c.y} r={HEX_SIZE * 0.42} color={owner?.color ?? "#fff"} />
                    {selected && <Circle cx={c.x} cy={c.y} r={HEX_SIZE * 0.5} color="#fff" style="stroke" strokeWidth={2} />}
                  </Group>
                );
              })}
            </Group>
          </Canvas>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function mixColor(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const r = Math.round(pa.r * (1 - t) + pb.r * t);
  const g = Math.round(pa.g * (1 - t) + pb.g * t);
  const bl = Math.round(pa.b * (1 - t) + pb.b * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}
function parseHex(h: string): { r: number; g: number; b: number } {
  const x = h.replace("#", "");
  return { r: parseInt(x.slice(0, 2), 16), g: parseInt(x.slice(2, 4), 16), b: parseInt(x.slice(4, 6), 16) };
}
