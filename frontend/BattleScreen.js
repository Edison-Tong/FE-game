import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Animated,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useEffect, useState, useRef, useMemo } from "react";
import { BACKEND_URL } from "@env";
import { weaponsData } from "./WeaponsData";

export default function BattleScreen() {
  const route = useRoute();
  const { userId, roomId } = route.params || {};
  const [currentTurnUserId, setCurrentTurnUserId] = useState(null);
  const [isEndingTurn, setIsEndingTurn] = useState(false);
  const [teams, setTeams] = useState([]);
  const [attacked, setAttacked] = useState({});
  const [localAttackedOverrides, setLocalAttackedOverrides] = useState({});
  const [selectedAttackerId, setSelectedAttackerId] = useState(null);
  const [opponentOrder, setOpponentOrder] = useState({});
  const [teamOrder, setTeamOrder] = useState({});
  const [initialHealths, setInitialHealths] = useState({});
  const [statModalVisible, setStatModalVisible] = useState(false);
  const [statModalChar, setStatModalChar] = useState(null);
  const [battleModalVisible, setBattleModalVisible] = useState(false);
  const [battleAttackerId, setBattleAttackerId] = useState(null);
  const [battleDefenderId, setBattleDefenderId] = useState(null);
  const [isPerformingAttack, setIsPerformingAttack] = useState(false);
  const [battleResults, setBattleResults] = useState(null);
  const pollRef = useRef(null);
  const battleModalAttackerRef = useRef(null);
  const battleModalDefenderRef = useRef(null);
  const statModalCharRef = useRef(null);

  // helper: weapon lookup
  const getWeaponStats = (character) => {
    try {
      const key = (character.base_weapon || "").toLowerCase();
      return (weaponsData.weapons && weaponsData.weapons[key] && weaponsData.weapons[key].stats) || {};
    } catch (e) {
      return {};
    }
  };

  // Consolidated stats computation: power, protection, and advanced stats
  const computeAllStats = (character) => {
    const weapon = getWeaponStats(character);
    const isMage = character.type && String(character.type).toLowerCase() === "mage";

    // Power
    const power = isMage
      ? (Number(character.magick) || 0) + (Number(weapon.mgk) || 0)
      : (Number(character.strength) || 0) + (Number(weapon.str) || 0);

    // Protection
    const prot = {
      melee: (Number(character.defense) || 0) + (Number(weapon.def) || 0),
      magic: (Number(character.resistance) || 0) + (Number(weapon.res) || 0),
    };

    // Advanced stats
    const spd = (Number(character.speed) || 0) + (Number(weapon.spd) || 0);
    const skl = (Number(character.skill) || 0) + (Number(weapon.skl) || 0);
    const knl = (Number(character.knowledge) || 0) + (Number(weapon.knl) || 0);
    const lck = (Number(character.luck) || 0) + (Number(weapon.lck) || 0);
    const def = (Number(character.defense) || 0) + (Number(weapon.def) || 0);
    const res = (Number(character.resistance) || 0) + (Number(weapon.res) || 0);

    // Size-based modifiers
    const size = Number(character.size) || 0;
    let sizePower = 0,
      sizeAgility = 0,
      sizeAccuracy = 0,
      sizeEvasion = 0;
    if (size === 1) {
      sizeAgility = 1;
      sizeEvasion = 1;
      sizeAccuracy = -2;
    } else if (size === 2) {
      sizeEvasion = 2;
      sizePower = -1;
    } else if (size === 3) {
      sizePower = 1;
      sizeEvasion = -2;
    } else if (size === 4) {
      sizeAccuracy = 2;
      sizePower = 1;
      sizeAgility = -1;
    }

    // Weapon-based multipliers
    const wepKey = (character.base_weapon || "").toLowerCase();
    let wepPowerMult = 1,
      wepAgilityMult = 1,
      wepAccuracyMult = 1,
      wepEvasionMult = 1,
      wepProtMult = 1,
      wepLuckMult = 1;
    if (wepKey === "axe" || wepKey === "fire") {
      wepPowerMult = 1.5;
    } else if (wepKey === "sword" || wepKey === "water") {
      wepEvasionMult = 1.5;
    } else if (wepKey === "dagger" || wepKey === "lightning") {
      wepAgilityMult = 1.5;
    } else if (wepKey === "lance" || wepKey === "earth") {
      wepProtMult = 1.5;
    } else if (wepKey === "bow" || wepKey === "aether") {
      wepAccuracyMult = 1.5;
    } else if (wepKey === "wind") {
      wepAccuracyMult = 1.25;
      wepEvasionMult = 1.25;
    } else if (wepKey === "light") {
      wepProtMult = 1.25;
      wepAccuracyMult = 1.25;
    } else if (wepKey === "dark") {
      wepPowerMult = 1.25;
      wepProtMult = 1.25;
    } else if (wepKey === "gauntlets" || wepKey === "grey" || wepKey === "gray") {
      wepLuckMult = 1.5;
    }

    const adjLck = lck * wepLuckMult;

    return {
      power: Math.round((power + sizePower) * wepPowerMult),
      protection: {
        melee: Math.round(prot.melee * wepProtMult),
        magic: Math.round(prot.magic * wepProtMult),
      },
      agility: Math.round((spd + sizeAgility) * wepAgilityMult),
      accuracy: Math.round(Math.ceil(0.5 * spd + 0.5 * skl + 1 * knl + 0.5 * adjLck) * wepAccuracyMult + sizeAccuracy),
      evasion: Math.round(Math.ceil(0.5 * spd + 1 * skl + 0.5 * knl + 0.5 * adjLck) * wepEvasionMult + sizeEvasion),
      critical: Math.ceil(0.5 * spd + 0.5 * skl + 0.5 * knl + 1 * adjLck),
      block: def + res + adjLck,
    };
  };

  const computeAdvancedStats = (character) => {
    const weapon = getWeaponStats(character);
    const spd = (Number(character.speed) || 0) + (Number(weapon.spd) || 0);
    const skl = (Number(character.skill) || 0) + (Number(weapon.skl) || 0);
    const knl = (Number(character.knowledge) || 0) + (Number(weapon.knl) || 0);
    const lck = (Number(character.luck) || 0) + (Number(weapon.lck) || 0);
    const def = (Number(character.defense) || 0) + (Number(weapon.def) || 0);
    const res = (Number(character.resistance) || 0) + (Number(weapon.res) || 0);

    // Size-based modifiers
    const size = Number(character.size) || 0;
    let sizeAgility = 0,
      sizeAccuracy = 0,
      sizeEvasion = 0;
    if (size === 1) {
      sizeAgility = 1;
      sizeEvasion = 1;
      sizeAccuracy = -2;
    } else if (size === 2) {
      sizeEvasion = 2;
      sizeAccuracy = 0;
    } else if (size === 3) {
      sizeEvasion = -2;
    } else if (size === 4) {
      sizeAccuracy = 2;
      sizeAgility = -1;
    }

    // Weapon-based multipliers
    const wepKey = (character.base_weapon || "").toLowerCase();
    let wepAgilityMult = 1,
      wepAccuracyMult = 1,
      wepEvasionMult = 1,
      wepLuckMult = 1;
    if (wepKey === "sword" || wepKey === "water") {
      wepEvasionMult = 1.5;
    } else if (wepKey === "dagger" || wepKey === "lightning") {
      wepAgilityMult = 1.5;
    } else if (wepKey === "bow" || wepKey === "aether") {
      wepAccuracyMult = 1.5;
    } else if (wepKey === "wind") {
      wepAccuracyMult = 1.25;
      wepEvasionMult = 1.25;
    } else if (wepKey === "light") {
      wepAccuracyMult = 1.25;
    } else if (wepKey === "gauntlets" || wepKey === "grey" || wepKey === "gray") {
      wepLuckMult = 1.5;
    }

    const adjLck = lck * wepLuckMult;

    return {
      agility: Math.round((spd + sizeAgility) * wepAgilityMult),
      accuracy: Math.round(Math.ceil(0.5 * spd + 0.5 * skl + 1 * knl + 0.5 * adjLck) * wepAccuracyMult + sizeAccuracy),
      evasion: Math.round(Math.ceil(0.5 * spd + 1 * skl + 0.5 * knl + 0.5 * adjLck) * wepEvasionMult + sizeEvasion),
      critical: Math.ceil(0.5 * spd + 0.5 * skl + 0.5 * knl + 1 * adjLck),
      block: def + res + adjLck,
    };
  };

  // height reserved for the confirm/cancel area inside battle modal (ignored when calculating thirds)
  const CONFIRM_AREA_HEIGHT = 80;

  // Terrain options for battle modal with stat multipliers
  const TERRAIN_OPTIONS = [
    { label: "Normal", value: "normal" },
    { label: "Town", value: "town" },
    { label: "Castle", value: "castle" },
    { label: "Forest", value: "forest" },
    { label: "Fort", value: "fort" },
    { label: "Water", value: "water" },
    { label: "Desert", value: "desert" },
    { label: "Mountain", value: "mountain" },
    { label: "High Ground", value: "highground" },
  ];

  // Terrain modifier definitions — multipliers applied to the character standing on that terrain
  const TERRAIN_MODIFIERS = {
    normal: {},
    town: { defense: 1.1, accuracy: 0.85, evasion: 1.15 },
    castle: { defense: 1.15, accuracy: 1.15, evasion: 1.15 },
    forest: { evasion: 1.2 },
    fort: { defense: 1.1, accuracy: 1.1, evasion: 1.15 },
    water: { accuracy: 0.85, evasion: 0.85 },
    desert: { accuracy: 0.8, evasion: 0.8 },
    mountain: { accuracy: 1.15, evasion: 0.85 },
    highground: { accuracy: 1.15 }, // also gives enemy 0.85x accuracy — handled separately
  };
  const CARRYING_MODIFIERS = { defense: 0.85, agility: 0.85 };

  // Apply terrain + carrying modifiers to a stats object.
  // enemyOnHighGround: if the opponent is on High Ground, this character gets 0.85x accuracy.
  const applyTerrainModifiers = (stats, terrain, carrying, enemyOnHighGround) => {
    const mods = TERRAIN_MODIFIERS[terrain] || {};
    const protMeleeBase = stats.protection.melee;
    const protMagicBase = stats.protection.magic;
    const defMult = (mods.defense || 1) * (carrying ? CARRYING_MODIFIERS.defense : 1);
    const accMult = (mods.accuracy || 1) * (enemyOnHighGround ? 0.85 : 1);
    const evaMult = mods.evasion || 1;
    const agiMult = carrying ? CARRYING_MODIFIERS.agility : 1;
    return {
      ...stats,
      protection: {
        melee: Math.round(protMeleeBase * defMult),
        magic: Math.round(protMagicBase * defMult),
      },
      accuracy: Math.round(stats.accuracy * accMult),
      evasion: Math.round(stats.evasion * evaMult),
      agility: Math.round(stats.agility * agiMult),
    };
  };

  // Get special attacks for a character based on their specific chosen abilities
  const getSpecialAttacks = (character) => {
    if (!character) return [];
    const wepKey = (character.base_weapon || "").toLowerCase();
    const allAbilities = (weaponsData.weaponAbilities && weaponsData.weaponAbilities[wepKey]) || [];
    const charAbilityNames = [character.weapon_ability1, character.weapon_ability2].filter(Boolean);
    if (charAbilityNames.length === 0) return allAbilities;
    return allAbilities.filter((a) => charAbilityNames.includes(a.name));
  };

  const renderHealthBar = (character) => {
    const maxHealth =
      initialHealths && initialHealths[character.id] != null
        ? initialHealths[character.id]
        : character.max_health || character.maxHealth || 20;
    const health = Math.max(0, Number(character.health) || 0);
    const percent = Math.max(0, Math.min(1, health / maxHealth));
    const ticks = 10;
    const filledTicks = Math.round(percent * ticks);

    return (
      <View style={barStyles.hpBarContainer}>
        <View style={barStyles.hpBarBackground}>
          <View style={[barStyles.hpBarFill, { width: `${percent * 100}%` }]} />
          <View style={barStyles.ticksContainer} pointerEvents="none">
            {Array.from({ length: ticks }).map((_, i) => (
              <View key={i} style={[barStyles.tick, i < filledTicks ? { opacity: 0 } : { opacity: 0.4 }]} />
            ))}
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 4 }}>
          <Text style={{ color: "#fff", fontSize: 11 }}>{health}</Text>
          <Text style={{ color: "#aaa", fontSize: 11, marginLeft: 6 }}>/ {maxHealth}</Text>
        </View>
      </View>
    );
  };

  const getWeaponStatLabel = (key) => {
    const labels = {
      str: "Strength",
      mgk: "Magick",
      def: "Defense",
      res: "Resistance",
      spd: "Speed",
      skl: "Skill",
      knl: "Knowledge",
      lck: "Luck",
    };
    if (labels[key]) return labels[key];
    if (!key || typeof key !== "string") return String(key);
    // Capitalize only the first letter for unknown keys (e.g. "range" -> "Range")
    return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
  };

  const handleAttack = async (targetId, attackerId = null, options = {}) => {
    const { skipModalReopen = false, damage, counterDamage, sequence } = options;
    const attacker = attackerId || selectedAttackerId;
    if (!attacker) {
      Alert.alert("Select Attacker", "Please select a character to attack with.");
      return;
    }
    if (currentTurnUserId !== userId) return;

    // capture pre-attack health for simple diffing if server doesn't return detailed events
    const allChars = (teams || []).flatMap((t) => t.characters || []);
    const attackerObjBefore = allChars.find((c) => String(c.id) === String(attacker));
    const defenderObjBefore = allChars.find((c) => String(c.id) === String(targetId));
    const preAttHealth = attackerObjBefore ? Number(attackerObjBefore.health || 0) : 0;
    const preDefHealth = defenderObjBefore ? Number(defenderObjBefore.health || 0) : 0;

    setIsPerformingAttack(true);
    try {
      const body = { roomId, attackerId: attacker, targetId, userId };
      if (options.sequence) body.sequence = options.sequence;
      else {
        body.damage = damage;
        body.counterDamage = counterDamage;
      }
      const res = await fetch(`${BACKEND_URL}/attack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.attacked) setAttacked(data.attacked);
        // Apply any updated characters returned by server (supports sequence)
        if (Array.isArray(data.updatedCharacters) && data.updatedCharacters.length > 0) {
          setTeams((prev) =>
            prev.map((t) => ({
              ...t,
              characters: t.characters.map((c) => {
                const found = data.updatedCharacters.find((uc) => uc.id === c.id);
                return found ? found : c;
              }),
            }))
          );
        }
        // If we sent a sequence, prefer showing the client-computed previewResults
        if (sequence && Array.isArray(sequence) && sequence.length > 0) {
          const previewEv = sequence.map((s, idx) => {
            const actor = idx % 2 === 0 ? "attacker" : "defender";
            const type = s.type || (s.damage > 0 ? "hit" : "miss");
            const ev = { actor, type };
            if (type === "hit" && s.damage) ev.damage = s.damage;
            return ev;
          });
          setBattleResults(previewEv);
          setSelectedAttackerId(null);
          setBattleAttackerId(attacker);
          setBattleDefenderId(targetId);
          if (!skipModalReopen) setBattleModalVisible(true);
        }
        // legacy single-target response handling
        if (data.updatedTarget) {
          setTeams((prev) =>
            prev.map((t) => ({
              ...t,
              characters: t.characters.map((c) => (c.id === data.updatedTarget.id ? data.updatedTarget : c)),
            }))
          );
        }
        if (data.updatedAttacker) {
          setTeams((prev) =>
            prev.map((t) => ({
              ...t,
              characters: t.characters.map((c) => (c.id === data.updatedAttacker.id ? data.updatedAttacker : c)),
            }))
          );
        }
        // prefer server-provided events if available
        if (data.results && Array.isArray(data.results) && data.results.length) {
          setBattleResults(data.results);
          // keep attacker selected cleared but keep modal open so results display
          setSelectedAttackerId(null);
          setBattleAttackerId(attacker);
          setBattleDefenderId(targetId);
          // keep modal visible to show results (unless skipModalReopen)
          if (!skipModalReopen) setBattleModalVisible(true);
        } else {
          // infer a simple attacker->defender event using health diffs
          const inferred = [];
          let newDefHealth = preDefHealth;
          if (data.updatedTarget && data.updatedTarget.health != null)
            newDefHealth = Number(data.updatedTarget.health || 0);
          const dmg = Math.max(0, preDefHealth - newDefHealth);
          if (dmg > 0) {
            inferred.push({ actor: "attacker", type: "hit", damage: dmg });
          } else {
            // If we sent a client damage of 0, prefer displaying a block event instead of a miss
            if (damage === 0) inferred.push({ actor: "attacker", type: "block" });
            else inferred.push({ actor: "attacker", type: "miss" });
          }

          // try to infer a counterattack if server returned an updated attacker
          if (data.updatedAttacker && data.updatedAttacker.health != null) {
            const newAttHealth = Number(data.updatedAttacker.health || 0);
            const dmgAtk = Math.max(0, preAttHealth - newAttHealth);
            if (dmgAtk > 0) inferred.push({ actor: "defender", type: "hit", damage: dmgAtk });
            else inferred.push({ actor: "defender", type: "miss" });
            // also update teams with updatedAttacker
            setTeams((prev) =>
              prev.map((t) => ({
                ...t,
                characters: t.characters.map((c) => (c.id === data.updatedAttacker.id ? data.updatedAttacker : c)),
              }))
            );
          }

          setBattleResults(inferred);

          // keep attacker selected cleared but keep modal open so results display
          setSelectedAttackerId(null);
          setBattleAttackerId(attacker);
          setBattleDefenderId(targetId);
          // keep modal visible to show results (unless skipModalReopen)
          if (!skipModalReopen) setBattleModalVisible(true);
        }
      } else {
        let msg = "Could not perform attack";
        try {
          const errJson = await res.json();
          if (errJson && errJson.message) msg = errJson.message;
        } catch (e) {}
        Alert.alert("Attack Failed", msg);
      }
    } catch (err) {
      console.log("attack error", err);
      Alert.alert("Network Error", "Could not contact server. Try again.");
    } finally {
      setIsPerformingAttack(false);
    }
  };

  useEffect(() => {
    const fetchState = async () => {
      if (!roomId) return;
      try {
        const res = await fetch(`${BACKEND_URL}/battle-state?roomId=${roomId}`);
        if (!res.ok) return;
        const data = await res.json();
        setCurrentTurnUserId(data.currentTurnUserId || null);
        setAttacked(data.attacked || {});
        setTeams(data.teams || []);

        try {
          const allChars = (data.teams || []).flatMap((t) => t.characters || []);
          if (allChars && allChars.length) {
            setInitialHealths((prev) => {
              const next = { ...prev };
              for (const c of allChars) {
                if (next[c.id] == null) next[c.id] = Number(c.health) || 0;
              }
              return next;
            });
          }
        } catch (e) {}

        try {
          // Maintain a stable order for every team so characters don't jump around in the UI
          const teamsList = data.teams || [];
          setTeamOrder((prev) => {
            const next = { ...(prev || {}) };
            for (const t of teamsList) {
              try {
                const teamKey = String(t.id);
                const existing = (prev && prev[teamKey]) || [];
                const idsNow = (t.characters || []).map((c) => c.id);
                const merged = [...existing, ...idsNow.filter((id) => !existing.includes(id))];
                const filtered = merged.filter((id) => idsNow.includes(id));
                next[teamKey] = filtered;
              } catch (e) {
                // ignore per-team errors
              }
            }
            return next;
          });
        } catch (e) {}

        if (selectedAttackerId) {
          const allChars = (data.teams || []).flatMap((t) => t.characters || []);
          const sel = allChars.find((c) => String(c.id) === String(selectedAttackerId));
          if (sel && Number(sel.health || 0) <= 0) {
            setSelectedAttackerId(null);
          } else if (data.attacked && data.attacked[selectedAttackerId]) {
            setSelectedAttackerId(null);
          }
        }
      } catch (err) {
        console.log("BattleScreen: error fetching battle-state", err);
      }
    };

    fetchState();
    pollRef.current = setInterval(fetchState, 1500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [roomId]);

  // Keep local-attacked overrides until the player's turn ends. When the turn leaves the player,
  // clear the local overrides so server state becomes authoritative for the next turn.
  useEffect(() => {
    if (currentTurnUserId && currentTurnUserId !== userId) {
      setLocalAttackedOverrides({});
    }
  }, [currentTurnUserId, userId]);

  let turnText = "Waiting...";
  if (currentTurnUserId) turnText = currentTurnUserId === userId ? "It is your turn" : "It is your opponent's turn";

  const openStatModal = (char) => {
    statModalCharRef.current = char;
    setStatModalChar(char);
    setStatModalVisible(true);
  };
  const closeStatModal = () => {
    setStatModalVisible(false);
    setStatModalChar(null);
    statModalCharRef.current = null;
  };

  if (currentTurnUserId) {
    turnText = currentTurnUserId === userId ? "It is your turn" : "It is your opponent's turn";
  }

  // Local modal components so they can access computeAllStats, computeAdvancedStats, renderHealthBar
  const LocalStatModal = ({ visible, character, onClose }) => {
    if (!character) return null;
    const weapon = ((weaponsData.weapons || {})[(character.base_weapon || "").toLowerCase()] || {}).stats || {};
    const allStats = computeAllStats(character);
    const isMage = character.type && String(character.type).toLowerCase() === "mage";
    const powerLabel = isMage ? "Power (Mag)" : "Power (Mel)";
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.content, modalStyles.statContent, { padding: 20 }]}>
            <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
              <Text style={modalStyles.closeText}>×</Text>
            </TouchableOpacity>
            <ScrollView>
              <Text style={modalStyles.detailName}>{character.name}</Text>
              <Text style={modalStyles.detailLabel}>
                {character.label} • {character.type} • size:{" "}
                {character.size != null ? character.size : character.sizeValue != null ? character.sizeValue : "N/A"}
              </Text>
              <View style={{ marginBottom: 8 }}>{renderHealthBar(character)}</View>
              <View style={{ height: 8 }} />
              <View>
                <Text style={{ color: "#C9A66B", fontWeight: "700", marginBottom: 6 }}>Stats</Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Strength</Text>
                      <Text style={modalStyles.statValue}>{character.strength}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Defense</Text>
                      <Text style={modalStyles.statValue}>{character.defense}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Speed</Text>
                      <Text style={modalStyles.statValue}>{character.speed}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Knowledge</Text>
                      <Text style={modalStyles.statValue}>{character.knowledge}</Text>
                    </View>
                  </View>
                  <View style={{ width: 1, backgroundColor: "#444", marginHorizontal: 4 }} />
                  <View style={{ flex: 1, paddingLeft: 8 }}>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Magick</Text>
                      <Text style={modalStyles.statValue}>{character.magick}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Resistance</Text>
                      <Text style={modalStyles.statValue}>{character.resistance}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Skill</Text>
                      <Text style={modalStyles.statValue}>{character.skill}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Luck</Text>
                      <Text style={modalStyles.statValue}>{character.luck}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={{ height: 8 }} />
              <View>
                <Text style={{ color: "#C9A66B", fontWeight: "700", marginBottom: 6 }}>Weapon</Text>
                <Text style={{ color: "#fff", marginBottom: 6 }}>{character.base_weapon}</Text>
                {weapon && Object.keys(weapon).length > 0 && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      {Object.entries(weapon)
                        .slice(0, Math.ceil(Object.entries(weapon).length / 2))
                        .map(([k, v]) => (
                          <View key={k} style={modalStyles.statRow}>
                            <Text style={modalStyles.statLabel}>{getWeaponStatLabel(k)}</Text>
                            <Text style={modalStyles.statValue}>{String(v)}</Text>
                          </View>
                        ))}
                    </View>
                    <View style={{ width: 1, backgroundColor: "#444", marginHorizontal: 4 }} />
                    <View style={{ flex: 1, paddingLeft: 8 }}>
                      {Object.entries(weapon)
                        .slice(Math.ceil(Object.entries(weapon).length / 2))
                        .map(([k, v]) => (
                          <View key={k} style={modalStyles.statRow}>
                            <Text style={modalStyles.statLabel}>{getWeaponStatLabel(k)}</Text>
                            <Text style={modalStyles.statValue}>{String(v)}</Text>
                          </View>
                        ))}
                    </View>
                  </View>
                )}
              </View>
              <View style={{ height: 8 }} />
              <View>
                <Text style={{ color: "#C9A66B", fontWeight: "700", marginBottom: 6 }}>Advanced Stats</Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>{powerLabel}</Text>
                      <Text style={modalStyles.statValue}>{allStats.power}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Protection (Mel)</Text>
                      <Text style={modalStyles.statValue}>{allStats.protection.melee}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Protection (Mag)</Text>
                      <Text style={modalStyles.statValue}>{allStats.protection.magic}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Evasion</Text>
                      <Text style={modalStyles.statValue}>{allStats.evasion}</Text>
                    </View>
                  </View>
                  <View style={{ width: 1, backgroundColor: "#444", marginHorizontal: 4 }} />
                  <View style={{ flex: 1, paddingLeft: 8 }}>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Agility</Text>
                      <Text style={modalStyles.statValue}>{allStats.agility}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Accuracy</Text>
                      <Text style={modalStyles.statValue}>{allStats.accuracy}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Critical</Text>
                      <Text style={modalStyles.statValue}>{allStats.critical}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Block</Text>
                      <Text style={modalStyles.statValue}>{allStats.block}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const LocalBattleModal = ({ visible, attacker, defender, onCancel, onConfirm, onDone, isBusy }) => {
    // local confirm state so toggling the button doesn't require re-rendering the parent/modal
    const [localConfirmPressed, setLocalConfirmPressed] = useState(false);
    const [previewResults, setPreviewResults] = useState(null);
    const [previewDefenderHealth, setPreviewDefenderHealth] = useState(null);
    const [previewAttackerHealth, setPreviewAttackerHealth] = useState(null);
    const [computedDamage, setComputedDamage] = useState(0);
    const [computedCounterDamage, setComputedCounterDamage] = useState(0);
    const [computedSequence, setComputedSequence] = useState([]);
    const [attackerTerrain, setAttackerTerrain] = useState(null);
    const [defenderTerrain, setDefenderTerrain] = useState(null);
    const [attackerCarrying, setAttackerCarrying] = useState(false);
    const [defenderCarrying, setDefenderCarrying] = useState(false);
    const [selectedSpecialAttack, setSelectedSpecialAttack] = useState(null);
    const [middlePage, setMiddlePage] = useState(0);
    const [middleWidth, setMiddleWidth] = useState(0);
    const middleScrollRef = useRef(null);
    if (!attacker || !defender) return null;
    const atkStats = computeAllStats(attacker);
    const defStats = computeAllStats(defender);

    // Compute attacker stats WITH special attack bonuses applied
    const atkStatsWithSpecial = (() => {
      if (!selectedSpecialAttack) return atkStats;
      const sa = selectedSpecialAttack;
      // Build a modified character with the special attack's stat bonuses added
      const mod = {
        ...attacker,
        strength: (Number(attacker.strength) || 0) + (Number(sa.str) || 0),
        magick: (Number(attacker.magick) || 0) + (Number(sa.mgk) || 0),
        defense: (Number(attacker.defense) || 0) + (Number(sa.def) || 0),
        resistance: (Number(attacker.resistance) || 0) + (Number(sa.res) || 0),
        speed: (Number(attacker.speed) || 0) + (Number(sa.spd) || 0),
        skill: (Number(attacker.skill) || 0) + (Number(sa.skl) || 0),
        knowledge: (Number(attacker.knowledge) || 0) + (Number(sa.knl) || 0),
        luck: (Number(attacker.luck) || 0) + (Number(sa.lck) || 0),
      };
      return computeAllStats(mod);
    })();

    // Apply terrain modifiers on top of special-attack-modified attacker stats
    const atkStatsFinal =
      attackerTerrain || attackerCarrying || defenderTerrain === "highground"
        ? applyTerrainModifiers(
            atkStatsWithSpecial,
            attackerTerrain || "normal",
            attackerCarrying,
            defenderTerrain === "highground"
          )
        : atkStatsWithSpecial;

    // Apply terrain modifiers to defender stats
    const defStatsFinal =
      defenderTerrain || defenderCarrying || attackerTerrain === "highground"
        ? applyTerrainModifiers(
            defStats,
            defenderTerrain || "normal",
            defenderCarrying,
            attackerTerrain === "highground"
          )
        : defStats;

    // Helper: renders a stat value with an optional delta indicator when special attack or terrain is active
    const hasModifiers =
      selectedSpecialAttack || attackerTerrain || defenderTerrain || attackerCarrying || defenderCarrying;
    const StatWithDelta = ({ base, modified, suffix, flipColor }) => {
      const diff = modified - base;
      const sfx = suffix || "";
      if (diff === 0 || !hasModifiers) {
        return (
          <Text style={modalStyles.statValue}>
            {base}
            {sfx}
          </Text>
        );
      }
      const isPositive = flipColor ? diff < 0 : diff > 0;
      return (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={[modalStyles.statValue, { color: "#888", textDecorationLine: "line-through", fontSize: 12 }]}>
            {base}
            {sfx}
          </Text>
          <Text style={{ color: isPositive ? "#4CAF50" : "#FF5252", fontWeight: "700", fontSize: 13, marginLeft: 4 }}>
            {modified}
            {sfx}
          </Text>
        </View>
      );
    };

    const resultsToShow = previewResults || battleResults;
    useEffect(() => {
      if (visible) {
        setLocalConfirmPressed(false);
        setPreviewResults(null);
        setPreviewDefenderHealth(null);
        setPreviewAttackerHealth(null);
        setComputedDamage(0);
        setComputedCounterDamage(0);
        setComputedSequence([]);
        setAttackerTerrain(null);
        setDefenderTerrain(null);
        setAttackerCarrying(false);
        setDefenderCarrying(false);
        setSelectedSpecialAttack(null);
        setMiddlePage(0);
      }
    }, [visible]);
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.content, { padding: 20, paddingBottom: 20 + CONFIRM_AREA_HEIGHT }]}>
            <TouchableOpacity style={modalStyles.closeButton} onPress={onCancel}>
              <Text style={modalStyles.closeText}>×</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              {/* Top third: attacker */}
              <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 12 }}>
                <Text style={modalStyles.detailName}>{attacker.name} 🔴</Text>
                <Text style={modalStyles.detailLabel}>
                  {attacker.label} • {attacker.type} • size:{" "}
                  {attacker.size != null ? attacker.size : attacker.sizeValue != null ? attacker.sizeValue : "N/A"}
                </Text>
                <View style={{ height: 8 }} />
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    {renderHealthBar(
                      previewAttackerHealth != null ? { ...attacker, health: previewAttackerHealth } : attacker
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => setAttackerCarrying((prev) => !prev)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginLeft: 10,
                      backgroundColor: attackerCarrying ? "#3a3520" : "#2a2a2a",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        borderWidth: 2,
                        borderColor: attackerCarrying ? "#C9A66B" : "#666",
                        backgroundColor: attackerCarrying ? "#C9A66B" : "transparent",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 6,
                      }}
                    >
                      {attackerCarrying && <Text style={{ color: "#1a1a2e", fontSize: 13, fontWeight: "800" }}>✓</Text>}
                    </View>
                    <Text style={{ color: attackerCarrying ? "#C9A66B" : "#bbb", fontSize: 12, fontWeight: "700" }}>
                      Carrying
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ color: "#C9A66B", fontWeight: "700", marginBottom: 6 }}>Advanced Stats</Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    {(() => {
                      const atkIsMage = attacker.type && String(attacker.type).toLowerCase() === "mage";
                      const atkPowerLabel = atkIsMage ? "Power (Mag)" : "Power (Mel)";
                      const atkPowerVal = Number(atkStats.power || 0);
                      const atkPowerMod = Number(atkStatsFinal.power || 0);
                      const defenderIsMage = defender.type && String(defender.type).toLowerCase() === "mage";
                      const attackerDefProtLabel = defenderIsMage ? "Protection (Mag)" : "Protection (Mel)";
                      const attackerDefProtVal = defenderIsMage
                        ? Number(atkStats.protection.magic || 0)
                        : Number(atkStats.protection.melee || 0);
                      const attackerDefProtMod = defenderIsMage
                        ? Number(atkStatsFinal.protection.magic || 0)
                        : Number(atkStatsFinal.protection.melee || 0);
                      return (
                        <>
                          <View style={modalStyles.statRow}>
                            <Text style={modalStyles.statLabel}>{atkPowerLabel}</Text>
                            <StatWithDelta base={atkPowerVal} modified={atkPowerMod} />
                          </View>
                          <View style={modalStyles.statRow}>
                            <Text style={modalStyles.statLabel}>{attackerDefProtLabel}</Text>
                            <StatWithDelta base={attackerDefProtVal} modified={attackerDefProtMod} />
                          </View>
                          <View style={modalStyles.statRow}>
                            <Text style={modalStyles.statLabel}>Evasion</Text>
                            <StatWithDelta base={atkStats.evasion} modified={atkStatsFinal.evasion} />
                          </View>
                        </>
                      );
                    })()}
                  </View>
                  <View style={{ width: 1, backgroundColor: "#444", marginHorizontal: 4 }} />
                  <View style={{ flex: 1, paddingLeft: 8 }}>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Agility</Text>
                      <StatWithDelta base={atkStats.agility} modified={atkStatsFinal.agility} />
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Accuracy</Text>
                      <StatWithDelta base={atkStats.accuracy} modified={atkStatsFinal.accuracy} />
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Critical</Text>
                      <StatWithDelta base={atkStats.critical} modified={atkStatsFinal.critical} />
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Block</Text>
                      <StatWithDelta base={atkStats.block} modified={atkStatsFinal.block} />
                    </View>
                  </View>
                </View>
              </View>

              {/* Middle third: swipeable – page 0 = battle stats, page 1 (swipe left) = tiles & special attack */}
              <View
                style={{ flex: 1, overflow: "hidden" }}
                onLayout={(e) => setMiddleWidth(e.nativeEvent.layout.width)}
              >
                {/* Page indicator dots */}
                <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 4 }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: middlePage === 0 ? "#C9A66B" : "#555",
                      marginHorizontal: 3,
                    }}
                  />
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: middlePage === 1 ? "#C9A66B" : "#555",
                      marginHorizontal: 3,
                    }}
                  />
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: middlePage === 2 ? "#C9A66B" : "#555",
                      marginHorizontal: 3,
                    }}
                  />
                </View>
                <ScrollView
                  ref={middleScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const page = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
                    setMiddlePage(page);
                  }}
                  style={{ flex: 1 }}
                >
                  {/* PAGE 0: Battle Stats */}
                  <View style={{ width: middleWidth || 300, paddingHorizontal: 12, justifyContent: "center" }}>
                    {(() => {
                      // Use final (special + terrain) stats
                      const effectiveAtkStats = atkStatsFinal;
                      const effectiveDefStats = defStatsFinal;
                      const atkWeapon = getWeaponStats(attacker) || {};
                      const defWeapon = getWeaponStats(defender) || {};
                      // Use special attack's hit% if selected, otherwise weapon's base hit%
                      const saHitPct = selectedSpecialAttack
                        ? Number(selectedSpecialAttack["hit%"] || atkWeapon["hit%"] || 0)
                        : Number(atkWeapon["hit%"] || 0);
                      const allyPower = Number(effectiveAtkStats.power || 0);
                      const enemyProt =
                        attacker.type && String(attacker.type).toLowerCase() === "mage"
                          ? Number(effectiveDefStats.protection.magic || 0)
                          : Number(effectiveDefStats.protection.melee || 0);
                      const dmg = Math.max(0, Math.round(allyPower - enemyProt));

                      const hitRaw =
                        saHitPct + (Number(effectiveAtkStats.accuracy || 0) - Number(effectiveDefStats.evasion || 0));
                      const hitPct = Math.max(0, Math.min(100, Math.round(hitRaw)));

                      const defLuck = (Number(defender.luck) || 0) + Number(defWeapon.lck || 0);
                      const critRaw = Number(effectiveAtkStats.critical || 0) - defLuck;
                      const critPct = Math.max(0, Math.round(critRaw));

                      const blkRaw = Number(effectiveDefStats.block || 0) - Number(effectiveAtkStats.accuracy || 0);
                      const blkPct = Math.max(0, Math.floor(blkRaw));

                      // Defender -> Attacker (counter)
                      const defBaseHit = Number(defWeapon["hit%"] || 0);
                      const defAllyPower = Number(effectiveDefStats.power || 0);
                      const enemyProtForDef =
                        defender.type && String(defender.type).toLowerCase() === "mage"
                          ? Number(effectiveAtkStats.protection.magic || 0)
                          : Number(effectiveAtkStats.protection.melee || 0);
                      const dmgDef = Math.max(0, Math.round(defAllyPower - enemyProtForDef));

                      const hitRawDef =
                        defBaseHit + (Number(effectiveDefStats.accuracy || 0) - Number(effectiveAtkStats.evasion || 0));
                      const hitPctDef = Math.max(0, Math.min(100, Math.round(hitRawDef)));

                      const atkLuck = (Number(attacker.luck) || 0) + Number(atkWeapon.lck || 0);
                      const defCritRaw = Number(effectiveDefStats.critical || 0) - atkLuck;
                      const critPctDef = Math.max(0, Math.round(defCritRaw));

                      const blkRawDef = Number(effectiveAtkStats.block || 0) - Number(effectiveDefStats.accuracy || 0);
                      const blkPctDef = Math.max(0, Math.floor(blkRawDef));

                      // Base (no modifiers) battle outcome stats for delta comparison
                      const baseWeaponHit = Number(atkWeapon["hit%"] || 0);
                      const basePower = Number(atkStats.power || 0);
                      const baseEnemyProt =
                        attacker.type && String(attacker.type).toLowerCase() === "mage"
                          ? Number(defStats.protection.magic || 0)
                          : Number(defStats.protection.melee || 0);
                      const baseDmg = Math.max(0, Math.round(basePower - baseEnemyProt));
                      const baseHitRaw =
                        baseWeaponHit + (Number(atkStats.accuracy || 0) - Number(defStats.evasion || 0));
                      const baseHitPct = Math.max(0, Math.min(100, Math.round(baseHitRaw)));
                      const baseCritRaw = Number(atkStats.critical || 0) - defLuck;
                      const baseCritPct = Math.max(0, Math.round(baseCritRaw));
                      const baseBlkRaw = Number(defStats.block || 0) - Number(atkStats.accuracy || 0);
                      const baseBlkPct = Math.max(0, Math.floor(baseBlkRaw));

                      const baseDefPower = Number(defStats.power || 0);
                      const baseEnemyProtForDef =
                        defender.type && String(defender.type).toLowerCase() === "mage"
                          ? Number(atkStats.protection.magic || 0)
                          : Number(atkStats.protection.melee || 0);
                      const baseDmgDef = Math.max(0, Math.round(baseDefPower - baseEnemyProtForDef));
                      const baseHitRawDef =
                        defBaseHit + (Number(defStats.accuracy || 0) - Number(atkStats.evasion || 0));
                      const baseHitPctDef = Math.max(0, Math.min(100, Math.round(baseHitRawDef)));
                      const baseDefCritRaw = Number(defStats.critical || 0) - atkLuck;
                      const baseCritPctDef = Math.max(0, Math.round(baseDefCritRaw));
                      const baseBlkRawDef = Number(atkStats.block || 0) - Number(defStats.accuracy || 0);
                      const baseBlkPctDef = Math.max(0, Math.floor(baseBlkRawDef));

                      return (
                        <>
                          <View style={{ flexDirection: "row" }}>
                            <View
                              style={{ flex: 1, backgroundColor: "#222", padding: 12, borderRadius: 8, marginRight: 6 }}
                            >
                              <Text style={{ color: "#C9A66B", fontWeight: "700", marginBottom: 8 }}>
                                Attacker → Defender
                              </Text>
                              <View style={modalStyles.statRow}>
                                <Text style={modalStyles.statLabel}>DMG</Text>
                                <StatWithDelta base={baseDmg} modified={dmg} />
                              </View>
                              <View style={modalStyles.statRow}>
                                <Text style={modalStyles.statLabel}>Hit %</Text>
                                <StatWithDelta base={baseHitPct} modified={hitPct} suffix="%" />
                              </View>
                              <View style={modalStyles.statRow}>
                                <Text style={modalStyles.statLabel}>Crit %</Text>
                                <StatWithDelta base={baseCritPct} modified={critPct} suffix="%" />
                              </View>
                              <View style={modalStyles.statRow}>
                                <Text style={modalStyles.statLabel}>Blk %</Text>
                                <StatWithDelta base={baseBlkPct} modified={blkPct} suffix="%" flipColor />
                              </View>
                            </View>

                            <View
                              style={{ flex: 1, backgroundColor: "#222", padding: 12, borderRadius: 8, marginLeft: 6 }}
                            >
                              <Text style={{ color: "#C9A66B", fontWeight: "700", marginBottom: 8 }}>
                                Defender → Attacker
                              </Text>
                              <View style={modalStyles.statRow}>
                                <Text style={modalStyles.statLabel}>DMG</Text>
                                <StatWithDelta base={baseDmgDef} modified={dmgDef} flipColor />
                              </View>
                              <View style={modalStyles.statRow}>
                                <Text style={modalStyles.statLabel}>Hit %</Text>
                                <StatWithDelta base={baseHitPctDef} modified={hitPctDef} suffix="%" flipColor />
                              </View>
                              <View style={modalStyles.statRow}>
                                <Text style={modalStyles.statLabel}>Crit %</Text>
                                <StatWithDelta base={baseCritPctDef} modified={critPctDef} suffix="%" flipColor />
                              </View>
                              <View style={modalStyles.statRow}>
                                <Text style={modalStyles.statLabel}>Blk %</Text>
                                <StatWithDelta base={baseBlkPctDef} modified={blkPctDef} suffix="%" />
                              </View>
                            </View>
                          </View>

                          <View style={{ alignItems: "center", marginTop: 8 }}>
                            <View style={{ alignItems: "center" }}>
                              <View
                                style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "center" }}
                              >
                                {/* Red dot 1 */}
                                <View style={{ alignItems: "center", marginHorizontal: 4 }}>
                                  <Text style={{ fontSize: 20 }}>🔴</Text>
                                  {resultsToShow && resultsToShow.length > 0 && resultsToShow[0] && (
                                    <View style={{ marginTop: 4 }}>
                                      {(() => {
                                        const ev = resultsToShow[0];
                                        const t = (ev.type || "").toLowerCase();
                                        if (t === "hit")
                                          return (
                                            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>
                                              {Number(ev.damage || 0)} DMG
                                            </Text>
                                          );
                                        if (t === "crit" || ev.critical)
                                          return (
                                            <Text style={{ color: "#ff4444", fontWeight: "700", fontSize: 12 }}>
                                              {Number(ev.damage || 0) + 2 || 2} CRIT
                                            </Text>
                                          );
                                        if (t === "dodge" || t === "evade")
                                          return <Text style={{ fontSize: 14 }}>💨</Text>;
                                        if (t === "block") return <Text style={{ fontSize: 14 }}>🛡️</Text>;
                                        if (t === "miss")
                                          return (
                                            <Text style={{ color: "#FFCCCC", fontWeight: "700", fontSize: 12 }}>
                                              MISS
                                            </Text>
                                          );
                                        return null;
                                      })()}
                                    </View>
                                  )}
                                </View>
                                <Text
                                  style={{ color: "#C9A66B", fontWeight: "700", marginHorizontal: 6, marginTop: 2 }}
                                >
                                  →
                                </Text>
                                {/* Blue dot 1 */}
                                <View style={{ alignItems: "center", marginHorizontal: 4 }}>
                                  <Text style={{ fontSize: 20 }}>🔵</Text>
                                  {resultsToShow && resultsToShow.length > 1 && resultsToShow[1] && (
                                    <View style={{ marginTop: 4 }}>
                                      {(() => {
                                        const ev = resultsToShow[1];
                                        const t = (ev.type || "").toLowerCase();
                                        if (t === "hit")
                                          return (
                                            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>
                                              {Number(ev.damage || 0)} DMG
                                            </Text>
                                          );
                                        if (t === "crit" || ev.critical)
                                          return (
                                            <Text style={{ color: "#ff4444", fontWeight: "700", fontSize: 12 }}>
                                              {Number(ev.damage || 0) + 2 || 2} CRIT
                                            </Text>
                                          );
                                        if (t === "dodge" || t === "evade")
                                          return <Text style={{ fontSize: 14 }}>💨</Text>;
                                        if (t === "block") return <Text style={{ fontSize: 14 }}>🛡️</Text>;
                                        if (t === "miss")
                                          return (
                                            <Text style={{ color: "#FFCCCC", fontWeight: "700", fontSize: 12 }}>
                                              MISS
                                            </Text>
                                          );
                                        return null;
                                      })()}
                                    </View>
                                  )}
                                </View>
                                <Text
                                  style={{ color: "#C9A66B", fontWeight: "700", marginHorizontal: 6, marginTop: 2 }}
                                >
                                  →
                                </Text>
                                {/* Red dot 2 */}
                                <View style={{ alignItems: "center", marginHorizontal: 4 }}>
                                  <Text style={{ fontSize: 20 }}>🔴</Text>
                                  {resultsToShow && resultsToShow.length > 2 && resultsToShow[2] && (
                                    <View style={{ marginTop: 4 }}>
                                      {(() => {
                                        const ev = resultsToShow[2];
                                        const t = (ev.type || "").toLowerCase();
                                        if (t === "hit")
                                          return (
                                            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>
                                              {Number(ev.damage || 0)} DMG
                                            </Text>
                                          );
                                        if (t === "crit" || ev.critical)
                                          return (
                                            <Text style={{ color: "#ff4444", fontWeight: "700", fontSize: 12 }}>
                                              {Number(ev.damage || 0) + 2 || 2} CRIT
                                            </Text>
                                          );
                                        if (t === "dodge" || t === "evade")
                                          return <Text style={{ fontSize: 14 }}>💨</Text>;
                                        if (t === "block") return <Text style={{ fontSize: 14 }}>🛡️</Text>;
                                        if (t === "miss")
                                          return (
                                            <Text style={{ color: "#FFCCCC", fontWeight: "700", fontSize: 12 }}>
                                              MISS
                                            </Text>
                                          );
                                        return null;
                                      })()}
                                    </View>
                                  )}
                                </View>
                                <Text
                                  style={{ color: "#C9A66B", fontWeight: "700", marginHorizontal: 6, marginTop: 2 }}
                                >
                                  →
                                </Text>
                                {/* Blue dot 2 */}
                                <View style={{ alignItems: "center", marginHorizontal: 4 }}>
                                  <Text style={{ fontSize: 20 }}>🔵</Text>
                                  {resultsToShow && resultsToShow.length > 3 && resultsToShow[3] && (
                                    <View style={{ marginTop: 4 }}>
                                      {(() => {
                                        const ev = resultsToShow[3];
                                        const t = (ev.type || "").toLowerCase();
                                        if (t === "hit")
                                          return (
                                            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>
                                              {Number(ev.damage || 0)} DMG
                                            </Text>
                                          );
                                        if (t === "crit" || ev.critical)
                                          return (
                                            <Text style={{ color: "#ff4444", fontWeight: "700", fontSize: 12 }}>
                                              {Number(ev.damage || 0) + 2 || 2} CRIT
                                            </Text>
                                          );
                                        if (t === "dodge" || t === "evade")
                                          return <Text style={{ fontSize: 14 }}>💨</Text>;
                                        if (t === "block") return <Text style={{ fontSize: 14 }}>🛡️</Text>;
                                        if (t === "miss")
                                          return (
                                            <Text style={{ color: "#FFCCCC", fontWeight: "700", fontSize: 12 }}>
                                              MISS
                                            </Text>
                                          );
                                        return null;
                                      })()}
                                    </View>
                                  )}
                                </View>
                              </View>
                            </View>
                          </View>
                        </>
                      );
                    })()}
                  </View>

                  {/* PAGE 1: Terrain Selection */}
                  <View style={{ width: middleWidth || 300 }}>
                    <ScrollView
                      style={{ flex: 1 }}
                      contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={true}
                    >
                      {/* Attacker Terrain */}
                      <Text style={{ color: "#C9A66B", fontWeight: "700", marginBottom: 4, fontSize: 13 }}>
                        🔴 {attacker.name}'s Terrain
                      </Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 6 }}>
                        {TERRAIN_OPTIONS.map((opt) => (
                          <TouchableOpacity
                            key={opt.value}
                            onPress={() => setAttackerTerrain(opt.value)}
                            style={{
                              backgroundColor: attackerTerrain === opt.value ? "#C9A66B" : "#333",
                              paddingVertical: 4,
                              paddingHorizontal: 9,
                              borderRadius: 6,
                              marginRight: 5,
                              marginBottom: 5,
                              borderWidth: 1,
                              borderColor: attackerTerrain === opt.value ? "#C9A66B" : "#555",
                            }}
                          >
                            <Text
                              style={{
                                color: attackerTerrain === opt.value ? "#1a1a2e" : "#ccc",
                                fontSize: 11,
                                fontWeight: "600",
                              }}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Defender Terrain */}
                      <Text style={{ color: "#C9A66B", fontWeight: "700", marginBottom: 4, fontSize: 13 }}>
                        🔵 {defender.name}'s Terrain
                      </Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 4 }}>
                        {TERRAIN_OPTIONS.map((opt) => (
                          <TouchableOpacity
                            key={opt.value}
                            onPress={() => setDefenderTerrain(opt.value)}
                            style={{
                              backgroundColor: defenderTerrain === opt.value ? "#C9A66B" : "#333",
                              paddingVertical: 4,
                              paddingHorizontal: 9,
                              borderRadius: 6,
                              marginRight: 5,
                              marginBottom: 5,
                              borderWidth: 1,
                              borderColor: defenderTerrain === opt.value ? "#C9A66B" : "#555",
                            }}
                          >
                            <Text
                              style={{
                                color: defenderTerrain === opt.value ? "#1a1a2e" : "#ccc",
                                fontSize: 11,
                                fontWeight: "600",
                              }}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  {/* PAGE 2: Special Attacks */}
                  <View style={{ width: middleWidth || 300, paddingHorizontal: 12, justifyContent: "center" }}>
                    <Text
                      style={{
                        color: "#C9A66B",
                        fontWeight: "700",
                        marginBottom: 10,
                        fontSize: 14,
                        textAlign: "center",
                      }}
                    >
                      ⚔️ Special Attacks
                    </Text>
                    <ScrollView style={{ flex: 1 }} nestedScrollEnabled>
                      <TouchableOpacity
                        onPress={() => setSelectedSpecialAttack(null)}
                        style={{
                          backgroundColor: !selectedSpecialAttack ? "#C9A66B" : "#333",
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 6,
                          marginBottom: 6,
                          borderWidth: 1,
                          borderColor: !selectedSpecialAttack ? "#C9A66B" : "#555",
                        }}
                      >
                        <Text
                          style={{
                            color: !selectedSpecialAttack ? "#1a1a2e" : "#ccc",
                            fontSize: 13,
                            fontWeight: "600",
                          }}
                        >
                          None (Normal Attack)
                        </Text>
                      </TouchableOpacity>
                      {getSpecialAttacks(attacker).map((atk, idx) => {
                        const isSelected = selectedSpecialAttack && selectedSpecialAttack.name === atk.name;
                        return (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => setSelectedSpecialAttack(atk)}
                            style={{
                              backgroundColor: isSelected ? "#C9A66B" : "#333",
                              paddingVertical: 8,
                              paddingHorizontal: 12,
                              borderRadius: 6,
                              marginBottom: 6,
                              borderWidth: 1,
                              borderColor: isSelected ? "#C9A66B" : "#555",
                            }}
                          >
                            <Text style={{ color: isSelected ? "#1a1a2e" : "#ccc", fontSize: 13, fontWeight: "600" }}>
                              {atk.name}
                            </Text>
                            <Text
                              style={{ color: isSelected ? "#333" : "#888", fontSize: 11, marginTop: 2 }}
                              numberOfLines={2}
                            >
                              {atk.effect}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </ScrollView>
              </View>

              {/* Bottom third: defender */}
              <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 12 }}>
                <Text style={modalStyles.detailName}>{defender.name} 🔵 </Text>
                <Text style={modalStyles.detailLabel}>
                  {defender.label} • {defender.type} • size: {defender.size}
                </Text>
                <View style={{ height: 8 }} />
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    {renderHealthBar(
                      previewDefenderHealth != null ? { ...defender, health: previewDefenderHealth } : defender
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => setDefenderCarrying((prev) => !prev)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginLeft: 10,
                      backgroundColor: defenderCarrying ? "#3a3520" : "#2a2a2a",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        borderWidth: 2,
                        borderColor: defenderCarrying ? "#C9A66B" : "#666",
                        backgroundColor: defenderCarrying ? "#C9A66B" : "transparent",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 6,
                      }}
                    >
                      {defenderCarrying && <Text style={{ color: "#1a1a2e", fontSize: 13, fontWeight: "800" }}>✓</Text>}
                    </View>
                    <Text style={{ color: defenderCarrying ? "#C9A66B" : "#bbb", fontSize: 12, fontWeight: "700" }}>
                      Carrying
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ color: "#C9A66B", fontWeight: "700", marginBottom: 6 }}>Advanced Stats</Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    {(() => {
                      const atkIsMage = attacker.type && String(attacker.type).toLowerCase() === "mage";
                      const defIsMage = defender.type && String(defender.type).toLowerCase() === "mage";
                      const defPowerLabel = defIsMage ? "Power (Mag)" : "Power (Mel)";
                      const defPowerVal = Number(defStats.power || 0);
                      const defPowerMod = Number(defStatsFinal.power || 0);
                      const defProtVal = atkIsMage
                        ? Number(defStats.protection.magic || 0)
                        : Number(defStats.protection.melee || 0);
                      const defProtMod = atkIsMage
                        ? Number(defStatsFinal.protection.magic || 0)
                        : Number(defStatsFinal.protection.melee || 0);
                      const defProtLabel = atkIsMage ? "Protection (Mag)" : "Protection (Mel)";
                      return (
                        <>
                          <View style={modalStyles.statRow}>
                            <Text style={modalStyles.statLabel}>{defPowerLabel}</Text>
                            <StatWithDelta base={defPowerVal} modified={defPowerMod} />
                          </View>
                          <View style={modalStyles.statRow}>
                            <Text style={modalStyles.statLabel}>{defProtLabel}</Text>
                            <StatWithDelta base={defProtVal} modified={defProtMod} />
                          </View>
                          <View style={modalStyles.statRow}>
                            <Text style={modalStyles.statLabel}>Evasion</Text>
                            <StatWithDelta base={defStats.evasion} modified={defStatsFinal.evasion} />
                          </View>
                        </>
                      );
                    })()}
                  </View>
                  <View style={{ width: 1, backgroundColor: "#444", marginHorizontal: 4 }} />
                  <View style={{ flex: 1, paddingLeft: 8 }}>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Agility</Text>
                      <StatWithDelta base={defStats.agility} modified={defStatsFinal.agility} />
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Accuracy</Text>
                      <StatWithDelta base={defStats.accuracy} modified={defStatsFinal.accuracy} />
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Critical</Text>
                      <StatWithDelta base={defStats.critical} modified={defStatsFinal.critical} />
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Block</Text>
                      <StatWithDelta base={defStats.block} modified={defStatsFinal.block} />
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View
              style={{
                position: "absolute",
                bottom: -10,
                left: 12,
                right: 12,
                flexDirection: "row",
                justifyContent: "space-between",
                zIndex: 60,
              }}
            >
              {localConfirmPressed ? (
                <TouchableOpacity
                  style={[styles.endTurnButton, { flex: 1 }]}
                  onPress={() => {
                    // Capture IDs before closing modal (refs will be cleared)
                    const attackerId = attacker && attacker.id;
                    const defenderId = defender && defender.id;
                    // Close modal first to prevent invisible overlay from blocking touches
                    if (onCancel) onCancel();
                    // POST the attack to backend (skip modal reopen)
                    try {
                      if (onConfirm && attackerId != null && defenderId != null) {
                        const seqToSend =
                          computedSequence && computedSequence.length > 0
                            ? computedSequence
                            : [
                                { targetId: defenderId, damage: computedDamage },
                                ...(computedCounterDamage
                                  ? [{ targetId: attackerId, damage: computedCounterDamage }]
                                  : []),
                              ];
                        onConfirm(attackerId, defenderId, {
                          skipModalReopen: true,
                          sequence: seqToSend,
                        });
                      }
                    } catch (e) {
                      console.log("onConfirm (Done) error", e);
                    }
                    // Mark attacker as attacked locally
                    try {
                      if (onDone && attackerId != null) onDone(attackerId);
                    } catch (e) {
                      console.log("onDone error", e);
                    }
                  }}
                >
                  <Text style={styles.endTurnText}>Done</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.endTurnButton, { flex: 1 }]}
                  onPress={() => {
                    if (!attackerTerrain || !defenderTerrain) {
                      Alert.alert(
                        "Terrain Required",
                        "Please swipe to the Terrain page and select a terrain for both the attacker and defender before confirming."
                      );
                      return;
                    }
                    try {
                      const seq = [];
                      const previewEvents = [];

                      // Helper to compute one attack from src to tgt using src/target stats
                      const computeHit = (src, srcStats, tgt, tgtStats, hitOverride) => {
                        const weapon = getWeaponStats(src) || {};
                        const baseHit = hitOverride != null ? Number(hitOverride) : Number(weapon["hit%"] || 0);
                        const power = Number(srcStats.power || 0);
                        const prot =
                          src.type && String(src.type).toLowerCase() === "mage"
                            ? Number(tgtStats.protection.magic || 0)
                            : Number(tgtStats.protection.melee || 0);
                        const damage = Math.max(0, Math.round(power - prot));

                        const hitRaw = baseHit + (Number(srcStats.accuracy || 0) - Number(tgtStats.evasion || 0));
                        const hitPct = Math.max(0, Math.min(100, Math.round(hitRaw)));

                        const blkRaw = Number(tgtStats.block || 0) - Number(srcStats.accuracy || 0);
                        const blkPct = Math.max(0, Math.floor(blkRaw));

                        const roll = Math.random() * 100;
                        const isHit = roll < hitPct;

                        if (!isHit || damage <= 0) return { type: "miss", damage: 0 };

                        const blockRoll = Math.random() * 100;
                        const isBlocked = blockRoll < blkPct;
                        if (isBlocked) return { type: "block", damage: 0 };
                        return { type: "hit", damage };
                      };

                      // A1 — use final (terrain+special) stats & hit% for attacker
                      const saHit = selectedSpecialAttack ? Number(selectedSpecialAttack["hit%"] || 0) : null;
                      const a1 = computeHit(attacker, atkStatsFinal, defender, defStatsFinal, saHit);
                      seq.push({ targetId: defender.id, damage: a1.damage, type: a1.type });
                      previewEvents.push(
                        a1.type === "hit"
                          ? { actor: "attacker", type: "hit", damage: a1.damage }
                          : { actor: "attacker", type: a1.type }
                      );
                      const defAfterA1 = Math.max(0, Number(defender.health || 0) - a1.damage);
                      setPreviewDefenderHealth(defAfterA1);
                      setComputedDamage(a1.damage || 0);

                      if (defAfterA1 <= 0) {
                        // defender died; sequence ends
                        setComputedSequence(seq);
                        setPreviewResults(previewEvents);
                        setPreviewAttackerHealth(Number(attacker.health || 0));
                        setLocalConfirmPressed(true);
                        return;
                      }

                      // D1
                      const d1 = computeHit(defender, defStatsFinal, attacker, atkStatsFinal);
                      seq.push({ targetId: attacker.id, damage: d1.damage, type: d1.type });
                      previewEvents.push(
                        d1.type === "hit"
                          ? { actor: "defender", type: "hit", damage: d1.damage }
                          : { actor: "defender", type: d1.type }
                      );
                      const attAfterD1 = Math.max(0, Number(attacker.health || 0) - d1.damage);
                      setPreviewAttackerHealth(attAfterD1);
                      setComputedCounterDamage(d1.damage || 0);

                      if (attAfterD1 <= 0) {
                        setComputedSequence(seq);
                        setPreviewResults(previewEvents);
                        setLocalConfirmPressed(true);
                        return;
                      }

                      // A2 (only if both alive)
                      const a2 = computeHit(
                        attacker,
                        atkStatsFinal,
                        { ...defender, health: defAfterA1 },
                        defStatsFinal,
                        saHit
                      );
                      seq.push({ targetId: defender.id, damage: a2.damage, type: a2.type });
                      previewEvents.push(
                        a2.type === "hit"
                          ? { actor: "attacker", type: "hit", damage: a2.damage }
                          : { actor: "attacker", type: a2.type }
                      );
                      const defAfterA2 = Math.max(0, defAfterA1 - a2.damage);
                      setPreviewDefenderHealth(defAfterA2);

                      if (defAfterA2 <= 0) {
                        setComputedSequence(seq);
                        setPreviewResults(previewEvents);
                        setLocalConfirmPressed(true);
                        return;
                      }

                      // D2
                      const d2 = computeHit(
                        defender,
                        defStatsFinal,
                        { ...attacker, health: attAfterD1 },
                        atkStatsFinal
                      );
                      seq.push({ targetId: attacker.id, damage: d2.damage, type: d2.type });
                      previewEvents.push(
                        d2.type === "hit"
                          ? { actor: "defender", type: "hit", damage: d2.damage }
                          : { actor: "defender", type: d2.type }
                      );
                      const attAfterD2 = Math.max(0, attAfterD1 - d2.damage);
                      setPreviewAttackerHealth(attAfterD2);

                      // finalize
                      setComputedSequence(seq);
                      setPreviewResults(previewEvents);
                    } catch (e) {
                      console.log("preview compute error", e);
                    }
                    setLocalConfirmPressed(true);
                  }}
                >
                  <Text style={styles.endTurnText}>Confirm Attack</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.turnBanner}>
        <Text style={styles.turnText}>{turnText}</Text>
      </View>
      {/* Player's characters shown at top half (always visible). Disabled when not player's turn. */}
      <View style={styles.playerArea}>
        <Text style={styles.caption}>
          {currentTurnUserId === userId ? "Select a character to attack" : "Your characters"}
        </Text>
        <View style={styles.charactersRow}>
          {(() => {
            const myTeam = teams.find((t) => String(t.user_id) === String(userId));
            if (!myTeam || !myTeam.characters) return <Text style={styles.noChars}>No characters</Text>;
            // render my team using preserved order if available
            const teamKey = String(myTeam.id);
            const order = teamOrder[teamKey] || myTeam.characters.map((c) => c.id);
            const charsById = {};
            myTeam.characters.forEach((c) => (charsById[c.id] = c));
            const ordered = order.map((id) => charsById[id]).filter(Boolean);
            const missing = myTeam.characters.filter((c) => !order.includes(c.id));
            const finalList = [...ordered, ...missing];
            return finalList.map((c) => {
              const effectiveAttacked = { ...(attacked || {}), ...(localAttackedOverrides || {}) };
              const hasAttacked = effectiveAttacked && effectiveAttacked[c.id];
              const isSelected = selectedAttackerId === c.id && currentTurnUserId === userId;
              const isDead = (c.health || 0) <= 0;
              const canSelect = !hasAttacked && currentTurnUserId === userId && !isDead;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.charCard,
                    hasAttacked || isDead ? styles.charCardDisabled : null,
                    isSelected ? styles.charCardSelected : null,
                  ]}
                  onPress={() => {
                    if (canSelect) setSelectedAttackerId(c.id);
                  }}
                  onLongPress={() => openStatModal(c)}
                >
                  <Text style={styles.charName}>{c.name || `Char ${c.id}`}</Text>
                  {renderHealthBar(c)}
                  <Text style={styles.weaponType}>{((c.base_weapon || "").toString() || "").toUpperCase()}</Text>
                  {isDead && <Text style={styles.charKO}>KO</Text>}
                </TouchableOpacity>
              );
            });
          })()}
        </View>
      </View>

      {/* Opponent area at bottom half */}
      <View style={styles.opponentArea}>
        <Text style={styles.caption}>Select the character you are attacking</Text>
        <View style={styles.charactersRow}>
          {(() => {
            const opponentTeam = teams.find((t) => String(t.user_id) !== String(userId));
            if (!opponentTeam || !opponentTeam.characters) return <Text style={styles.noChars}>No opponent</Text>;
            // render opponent characters using preserved order if available
            const teamKey = String(opponentTeam.id);
            const order = teamOrder[teamKey] || opponentTeam.characters.map((c) => c.id);
            const charsById = {};
            opponentTeam.characters.forEach((c) => (charsById[c.id] = c));
            const ordered = order.map((id) => charsById[id]).filter(Boolean);
            // append any characters not present in the stored order
            const missing = opponentTeam.characters.filter((c) => !order.includes(c.id));
            const finalList = [...ordered, ...missing];
            return finalList.map((c) => {
              const isDead = (c.health || 0) <= 0;
              const canBeTargeted = currentTurnUserId === userId && selectedAttackerId && !isDead;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.charCard, isDead ? styles.charCardDisabled : null]}
                  onPress={() => {
                    if (!canBeTargeted) return;
                    // if an attacker is selected, open the Battle Modal instead of immediate attack
                    if (selectedAttackerId) {
                      // find attacker object
                      const myTeam = teams.find((t) => String(t.user_id) === String(userId));
                      const attackerObj = myTeam
                        ? myTeam.characters.find((ch) => String(ch.id) === String(selectedAttackerId))
                        : null;
                      // Store the full character objects in refs so they persist across polling updates
                      battleModalAttackerRef.current = attackerObj;
                      battleModalDefenderRef.current = c;
                      setBattleAttackerId(attackerObj ? attackerObj.id : null);
                      setBattleDefenderId(c.id);
                      // Clear previous battle results so old damage isn't shown
                      setBattleResults(null);
                      // previously reset parent confirm state here; now handled locally in modal
                      setBattleModalVisible(true);
                      return;
                    }
                  }}
                  onLongPress={() => openStatModal(c)}
                >
                  <Text style={styles.charName}>{c.name || `Char ${c.id}`}</Text>
                  {renderHealthBar(c)}
                  <Text style={styles.weaponType}>{((c.base_weapon || "").toString() || "").toUpperCase()}</Text>
                  {isDead && <Text style={styles.charKO}>KO</Text>}
                </TouchableOpacity>
              );
            });
          })()}
        </View>
      </View>
      <View style={styles.bottomSpacer} />

      <TouchableOpacity
        style={[styles.endTurnButton, currentTurnUserId !== userId ? styles.endTurnButtonDisabled : null]}
        activeOpacity={0.8}
        disabled={currentTurnUserId !== userId || isEndingTurn}
        onPress={() => {
          if (currentTurnUserId !== userId) return;
          Alert.alert(
            "End Turn",
            "Are you sure you want to end your turn?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Yes",
                onPress: async () => {
                  try {
                    setIsEndingTurn(true);
                    const res = await fetch(`${BACKEND_URL}/end-turn`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ roomId, userId }),
                    });
                    if (res.ok) {
                      // let the polling update the turn; optionally read returned state
                      try {
                        const data = await res.json();
                        if (data && data.currentTurnUserId) setCurrentTurnUserId(data.currentTurnUserId);
                      } catch (err) {
                        // ignore JSON parse errors
                      }
                    } else {
                      let msg = "Could not end turn. Try again.";
                      try {
                        const errJson = await res.json();
                        if (errJson && errJson.message) msg = errJson.message;
                      } catch (e) {}
                      console.log("end-turn: server returned", res.status, msg);
                      Alert.alert("Error", msg);
                    }
                  } catch (err) {
                    console.log("end-turn error", err);
                    Alert.alert("Network Error", "Could not contact server. Try again.");
                  } finally {
                    setIsEndingTurn(false);
                  }
                },
              },
            ],
            { cancelable: true }
          );
        }}
      >
        {isEndingTurn ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.endTurnText}>{currentTurnUserId === userId ? "End Turn" : "Waiting..."}</Text>
        )}
      </TouchableOpacity>
      {/* Modals (local implementations) */}
      {useMemo(() => {
        const character = statModalCharRef.current;
        return <LocalStatModal visible={statModalVisible} character={character} onClose={closeStatModal} />;
      }, [statModalVisible])}
      {useMemo(() => {
        // Prefer character objects from refs (stored when modal was opened) to avoid flicker from polling updates
        const attacker = battleModalAttackerRef.current;
        const defender = battleModalDefenderRef.current;

        // Fall back to finding from current teams if refs are empty (should rarely happen)
        if (!attacker || !defender) {
          const allChars = (teams || []).flatMap((t) => t.characters || []);
          const attackerObj = battleAttackerId
            ? allChars.find((ch) => String(ch.id) === String(battleAttackerId))
            : null;
          const defenderObj = battleDefenderId
            ? allChars.find((ch) => String(ch.id) === String(battleDefenderId))
            : null;

          const makePlaceholder = (id) => ({
            id,
            name: `Char ${id}`,
            health: initialHealths && initialHealths[id] != null ? initialHealths[id] : 0,
            max_health: initialHealths && initialHealths[id] != null ? initialHealths[id] : 20,
            base_weapon: "",
            type: "",
            label: "",
            strength: 0,
            magick: 0,
            defense: 0,
            resistance: 0,
          });

          const finalAttacker = attackerObj || (battleAttackerId ? makePlaceholder(battleAttackerId) : null);
          const finalDefender = defenderObj || (battleDefenderId ? makePlaceholder(battleDefenderId) : null);

          return (
            <LocalBattleModal
              visible={battleModalVisible}
              attacker={finalAttacker}
              defender={finalDefender}
              onCancel={() => {
                setBattleModalVisible(false);
                setBattleAttackerId(null);
                setBattleDefenderId(null);
                battleModalAttackerRef.current = null;
                battleModalDefenderRef.current = null;
              }}
              onConfirm={(attId, defId, options) => handleAttack(defId, attId, options)}
              isBusy={isPerformingAttack}
              onDone={(attId) => {
                setLocalAttackedOverrides((prev) => ({ ...(prev || {}), [attId]: true }));
                setSelectedAttackerId(null);
              }}
            />
          );
        }

        return (
          <LocalBattleModal
            visible={battleModalVisible}
            attacker={attacker}
            defender={defender}
            onCancel={() => {
              setBattleModalVisible(false);
              setBattleAttackerId(null);
              setBattleDefenderId(null);
              battleModalAttackerRef.current = null;
              battleModalDefenderRef.current = null;
            }}
            onConfirm={(attId, defId, options) => handleAttack(defId, attId, options)}
            isBusy={isPerformingAttack}
            onDone={(attId) => {
              setLocalAttackedOverrides((prev) => ({ ...(prev || {}), [attId]: true }));
              setSelectedAttackerId(null);
            }}
          />
        );
      }, [battleModalVisible, isPerformingAttack])}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "stretch",
    justifyContent: "flex-start",
    backgroundColor: "#2B2B2B",
    paddingTop: 56,
  },
  turnBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 48,
    paddingVertical: 10,
    backgroundColor: "#3C3C3C",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#272727",
    zIndex: 20,
  },
  turnText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomSpacer: {
    height: 80,
  },
  endTurnButton: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 24,
    height: 56,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
  },
  endTurnButtonDisabled: {
    backgroundColor: "#888888",
  },
  endTurnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  playerArea: {
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 12,
    alignItems: "center",
  },
  caption: {
    color: "#DDD",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "600",
    textAlign: "center",
  },
  charactersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  charCard: {
    width: 110,
    minHeight: 80,
    backgroundColor: "#444",
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  charCardDisabled: {
    backgroundColor: "#2F2F2F",
    opacity: 0.5,
  },
  charCardSelected: {
    backgroundColor: "#3F3A2A",
    borderWidth: 2,
    borderColor: "#FFD700",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  charName: {
    color: "#FFF",
    fontWeight: "700",
    marginBottom: 6,
  },
  charStat: {
    color: "#CCC",
    fontSize: 12,
  },
  cardStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  cardStatLabel: {
    color: "#C9A66B",
    fontSize: 11,
    fontWeight: "600",
    marginRight: 4,
  },
  cardStatValue: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  /* compact variants for uncluttered card */
  cardStatsRowCompact: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  cardStatLabelCompact: {
    color: "#C9A66B",
    fontSize: 10,
    fontWeight: "600",
    marginRight: 6,
  },
  cardStatValueCompact: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
    marginRight: 8,
  },
  weaponType: {
    color: "#AAA",
    fontSize: 10,
    fontWeight: "700",
  },
  noChars: {
    color: "#999",
  },
  charKO: {
    color: "#FF6666",
    fontWeight: "700",
    marginTop: 4,
  },
  opponentArea: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 96,
    alignItems: "center",
    paddingBottom: 8,
  },
});

// LocalStatModal is declared inside the component; the module-level export was removed.

// LocalBattleModal is declared inside the component; the exported BattleModal was removed.

const barStyles = StyleSheet.create({
  hpBarContainer: {
    width: 110,
    alignItems: "center",
  },
  hpBarBackground: {
    width: "100%",
    height: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#444",
    position: "relative",
  },
  hpBarFill: {
    height: "100%",
    backgroundColor: "#00FF00",
  },
  ticksContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    paddingHorizontal: 0,
  },
  tick: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    marginHorizontal: 1,
  },
});

// Stat modal styles reuse some patterns from matchmaking
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    backgroundColor: "#2B2B2B",
    borderRadius: 14,
    padding: 20,
    maxHeight: "98%",
    height: "92%",
    width: "92%",
    borderWidth: 2,
    borderColor: "#C9A66B",
  },

  /* shorter variant for long-press stat modal */
  statContent: {
    maxHeight: "70%",
    height: "68%",
    width: "86%",
  },

  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeText: {
    fontSize: 20,
    color: "#FFD700",
    fontWeight: "bold",
  },
  detailName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: "#C9A66B",
    marginBottom: 8,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  statLabel: { color: "#C9A66B" },
  statValue: { color: "#fff", fontWeight: "700" },
});
/* Modal component rendered at bottom of file via state */
