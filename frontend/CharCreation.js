import { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  ScrollView,
} from "react-native";
import { weaponsData } from "./WeaponsData.js";
import { useNavigation, useRoute } from "@react-navigation/native";
import { BACKEND_URL } from "@env";

import DropDownPicker from "react-native-dropdown-picker";

export default function CharCreation() {
  const navigation = useNavigation();
  const route = useRoute();
  const { teamId } = route.params;
  const [openSize, setOpenSize] = useState(false);
  const [openType, setOpenType] = useState(false);
  const [invalidFields, setInvalidFields] = useState([]);

  const [openWeapon, setOpenWeapon] = useState(false);
  const [selectedAttacks, setSelectedAttacks] = useState([]);
  const [selectedSpecials, setSelectedSpecials] = useState([]);
  const [name, setName] = useState(null);
  const [label, setLabel] = useState(null);
  const [sizeValue, setSizeValue] = useState(null);
  const [bonus, setBonus] = useState(0);

  const sizeItems = useMemo(
    () => [
      { label: "1", value: 1 },
      { label: "2", value: 2 },
      { label: "3", value: 3 },
      { label: "4", value: 4 },
    ],
    []
  );

  const [typeValue, setTypeValue] = useState(null);

  const typeItems = useMemo(
    () => [
      { label: "Melee", value: "melee" },
      { label: "Mage", value: "mage" },
    ],
    []
  );

  // Team composition limits
  // maxMages = 2
  // sizes: 1 -> max 1, 4 -> max 1, 2 -> max 2, 3 -> max 2
  const [teamChars, setTeamChars] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetchChars = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/get-characters?teamId=${teamId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && data && Array.isArray(data.characters)) setTeamChars(data.characters);
      } catch (e) {
        console.log("fetch team chars error", e);
      }
    };
    fetchChars();
    return () => (mounted = false);
  }, [teamId]);

  const sizeCounts = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    (teamChars || []).forEach((c) => {
      const s = Number(c.size || c.sizeValue || 0);
      if (counts[s] != null) counts[s]++;
    });
    return counts;
  }, [teamChars]);

  const mageCount = useMemo(
    () => (teamChars || []).filter((c) => String(c.type).toLowerCase() === "mage").length,
    [teamChars]
  );

  // Derived dropdown items that include disabled flags based on team composition
  const computedSizeItems = useMemo(() => {
    const isFull = (s) =>
      (s === 1 && sizeCounts[1] >= 1) ||
      (s === 2 && sizeCounts[2] >= 2) ||
      (s === 3 && sizeCounts[3] >= 2) ||
      (s === 4 && sizeCounts[4] >= 1);
    const fullStyle = { color: "#FF6B6B", textDecorationLine: "line-through" };
    return [
      { label: "1", value: 1, ...(isFull(1) && { labelStyle: fullStyle }) },
      { label: "2", value: 2, ...(isFull(2) && { labelStyle: fullStyle }) },
      { label: "3", value: 3, ...(isFull(3) && { labelStyle: fullStyle }) },
      { label: "4", value: 4, ...(isFull(4) && { labelStyle: fullStyle }) },
    ];
  }, [sizeCounts]);

  const computedTypeItems = useMemo(() => {
    const mageFull = mageCount >= 2;
    return [
      { label: "Melee", value: "melee" },
      {
        label: "Mage",
        value: "mage",
        ...(mageFull && { labelStyle: { color: "#FF6B6B", textDecorationLine: "line-through" } }),
      },
    ];
  }, [mageCount]);

  // Temporary top notice (Animated)
  const [noticeText, setNoticeText] = useState("");
  const [noticeVisible, setNoticeVisible] = useState(false);
  const noticeTop = useMemo(() => new Animated.Value(-60), []);

  const showNotice = (text, ms = 3000) => {
    setNoticeText(text);
    setNoticeVisible(true);
    Animated.sequence([
      Animated.timing(noticeTop, { toValue: 0, duration: 220, useNativeDriver: false }),
      Animated.delay(ms),
      Animated.timing(noticeTop, { toValue: -60, duration: 220, useNativeDriver: false }),
    ]).start(() => {
      setNoticeVisible(false);
      setNoticeText("");
    });
  };

  const handleSizeSelect = (val) => {
    if (val == null) return;
    // find if this size is at limit
    if (
      (val === 1 && sizeCounts[1] >= 1) ||
      (val === 2 && sizeCounts[2] >= 2) ||
      (val === 3 && sizeCounts[3] >= 2) ||
      (val === 4 && sizeCounts[4] >= 1)
    ) {
      showNotice(`Size ${val} limit reached`);
      // revert to previous selection
      setSizeValue(prevSizeRef.current);
      return;
    }
    setSizeValue(val);
    setInvalidFields((prev) => prev.filter((f) => f !== "sizeValue"));
  };

  const handleTypeSelect = (val) => {
    if (val == null) return;
    if (val === "mage" && mageCount >= 2) {
      showNotice("Max 2 mages reached");
      // revert to previous value
      setTypeValue(prevTypeRef.current);
      return;
    }
    setTypeValue(val);
    setInvalidFields((prev) => prev.filter((f) => f !== "typeValue"));
    // reset weapon when type changes
    setWeaponValue(null);
  };

  const moveAmount = { melee: 5 + bonus, mage: 4 + bonus };
  // refs to track previous valid selections so we can revert if user selects a full option
  const prevSizeRef = useRef(sizeValue);
  const prevTypeRef = useRef(typeValue);
  useEffect(() => {
    prevSizeRef.current = sizeValue;
  }, [sizeValue]);
  useEffect(() => {
    prevTypeRef.current = typeValue;
  }, [typeValue]);
  const [weaponValue, setWeaponValue] = useState(null);

  const meleeWeapons = useMemo(
    () =>
      Object.entries(weaponsData.weapons)
        .filter(([_, w]) => w.type === "melee")
        .map(([key, w]) => ({ label: w.name ?? key, value: key })),
    [weaponsData]
  );

  const magicWeapons = useMemo(
    () =>
      Object.entries(weaponsData.weapons)
        .filter(([_, w]) => w.type === "magick")
        .map(([key, w]) => ({ label: w.name ?? key, value: key })),
    [weaponsData]
  );

  const [statsView, setStatsView] = useState("base");
  const initialBaseStats = {
    Hlth: 4,
    Str: 4,
    Def: 4,
    Mgk: 4,
    Res: 4,
    Spd: 4,
    Skl: 4,
    Knl: 4,
    Lck: 4,
  };
  const [statsTotal, setStatsTotal] = useState(36);

  const [baseStats, setBaseStats] = useState(initialBaseStats);

  const abilityList = useMemo(() => {
    return weaponsData.weaponAbilities[weaponValue] || [];
  }, [weaponValue, weaponsData]);

  const toggleAbility = (abilityName) => {
    setSelectedAttacks((prev) => {
      if (prev.includes(abilityName)) {
        return prev.filter((n) => n !== abilityName);
      }
      if (prev.length >= 2) return prev;
      return [...prev, abilityName];
    });
    setInvalidFields((prev) => prev.filter((f) => f !== "abilities"));
  };

  const specialMovesList = useMemo(() => {
    return (weaponsData.mageSpecialAbilities && weaponsData.mageSpecialAbilities[weaponValue]) || [];
  }, [weaponValue, weaponsData]);

  const toggleSpecialMove = (moveName) => {
    setSelectedSpecials((prev) => {
      if (prev.includes(moveName)) {
        return prev.filter((n) => n !== moveName);
      }
      if (prev.length >= 3) return prev;
      return [...prev, moveName];
    });
    setInvalidFields((prev) => prev.filter((f) => f !== "specials"));
  };

  useEffect(() => {
    if (!weaponValue) {
      setBonus(0);
      return;
    }

    setBonus(weaponValue === "wind" ? 1 : 0);
  });

  useEffect(() => {
    setWeaponValue(null);
    setSelectedSpecials([]);
    setSelectedAttacks([]);
  }, [typeValue]);

  const handleChange = (key, delta) => {
    setBaseStats((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
    setStatsTotal((prev) => prev + delta);
  };

  const handleSubmit = async () => {
    const missing = [];

    if (!name) missing.push("name");
    if (!label) missing.push("label");
    if (!typeValue) missing.push("typeValue");
    if (!sizeValue) missing.push("sizeValue");
    if (!weaponValue) missing.push("weaponValue");
    if (selectedAttacks.length < 2) missing.push("abilities");
    if (typeValue === "mage" && selectedSpecials.length < 3) {
      missing.push("specials");
    }

    if (missing.length > 0) {
      setInvalidFields(missing);
      alert("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/create-character`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          label,
          sizeValue,
          typeValue,
          moveAmount,
          weaponValue,
          baseStats,
          abilities: selectedAttacks,
          specialMoves: typeValue === "mage" ? selectedSpecials : [],
          teamId,
        }),
      });

      if (!res.ok) {
        alert("Character creation failed");
        return;
      }

      await fetch(`${BACKEND_URL}/increment-char-count`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });

      setInvalidFields([]);
      alert("Character created successfully!");

      navigation.reset({
        index: 1,
        routes: [{ name: "HomeScreen" }, { name: "TeamViewScreen", params: { teamId } }],
      });
    } catch (err) {
      alert("Something went wrong");
      console.error(err);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View key="char1" style={styles.container}>
        {noticeVisible && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.limitNotice,
              { position: "absolute", left: 8, right: 8, top: noticeTop, zIndex: 99999, elevation: 99999 },
            ]}
          >
            <Text style={styles.limitNoticeText}>{noticeText}</Text>
          </Animated.View>
        )}
        <View style={styles.charCard}>
          <TextInput
            style={[styles.charName, invalidFields.includes("name") && styles.invalidInput]}
            placeholder={"character name"}
            value={name}
            autoCorrect={false}
            onChangeText={(text) => {
              setName(text);
              setInvalidFields((prev) => prev.filter((f) => f !== "name"));
            }}
          />
          <TextInput
            style={[styles.charLabel, invalidFields.includes("label") && styles.invalidInput]}
            placeholder={"character label"}
            value={label}
            autoCorrect={false}
            onChangeText={(text) => {
              setLabel(text);
              setInvalidFields((prev) => prev.filter((f) => f !== "label"));
            }}
          />
          <View style={styles.charImage}>
            <Text>Character Image</Text>
          </View>
          <Text style={styles.charLvlLabel}>Level:</Text>
          <Text style={styles.charMoveLabel}>Move:</Text>
          <Text style={styles.charSizeLabel}>Size:</Text>
          <Text style={styles.charLvl}>1</Text>
          <Text style={styles.charMove}>{moveAmount[typeValue]}</Text>
          <View style={[styles.charSize, invalidFields.includes("sizeValue") && styles.invalidInput]}>
            <DropDownPicker
              open={openSize}
              placeholder="#"
              style={{
                backgroundColor: "#D4B36C",
                borderColor: "#8C6A41",
              }}
              dropDownContainerStyle={{
                backgroundColor: "#3B2A1A",
                borderColor: "#8C6A41",
              }}
              placeholderStyle={{
                color: "black",
              }}
              labelStyle={{
                color: "#EBD9B4",
              }}
              listItemContainerStyle={{
                backgroundColor: "#3B2A1A",
              }}
              listItemLabelStyle={{
                color: "#EBD9B4",
              }}
              listItemDisabledStyle={{ backgroundColor: "#2E2E2E" }}
              listItemDisabledLabelStyle={{ color: "#9E9E9E" }}
              disabledItemLabelStyle={{ color: "#9E9E9E" }}
              value={sizeValue}
              items={computedSizeItems}
              setOpen={setOpenSize}
              setValue={setSizeValue}
              onOpen={() => {
                setOpenType(false);
                setOpenWeapon(false);
              }}
              onChangeValue={(val) => handleSizeSelect(val)}
              zIndex={3000}
              zIndexInverse={1000}
            />
          </View>
          <View style={[styles.charType, invalidFields.includes("typeValue") && styles.invalidInput]}>
            <DropDownPicker
              open={openType}
              placeholder="Character Type"
              style={{
                backgroundColor: "#D4B36C",
                borderColor: "#8C6A41",
              }}
              dropDownContainerStyle={{
                backgroundColor: "#3B2A1A",
                borderColor: "#8C6A41",
              }}
              placeholderStyle={{
                color: "black",
              }}
              labelStyle={{
                color: "#EBD9B4",
              }}
              listItemContainerStyle={{
                backgroundColor: "#3B2A1A",
              }}
              listItemLabelStyle={{
                color: "#EBD9B4",
              }}
              listItemDisabledStyle={{ backgroundColor: "#2E2E2E" }}
              listItemDisabledLabelStyle={{ color: "#9E9E9E" }}
              disabledItemLabelStyle={{ color: "#9E9E9E" }}
              value={typeValue}
              items={computedTypeItems}
              setOpen={setOpenType}
              setValue={setTypeValue}
              onOpen={() => {
                setOpenSize(false);
                setOpenWeapon(false);
              }}
              onChangeValue={(val) => handleTypeSelect(val)}
              zIndex={3000}
              zIndexInverse={1000}
            />
          </View>
          <TouchableOpacity
            style={[styles.baseStatsBtn, statsView === "base" ? styles.pressed : styles.notPressed]}
            onPress={() => setStatsView("base")}
          >
            <View>
              <Text>Base</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.atkStatsBtn, statsView === "atk" ? styles.pressed : styles.notPressed]}
            onPress={() => setStatsView("atk")}
          >
            <View>
              <Text>Attacks</Text>
            </View>
          </TouchableOpacity>
          {typeValue === "mage" && (
            <TouchableOpacity
              style={[styles.specialMovesBtn, statsView === "special" ? styles.pressed : styles.notPressed]}
              onPress={() => setStatsView("special")}
            >
              <View>
                <Text style={{ fontSize: 11 }}>Special Moves</Text>
              </View>
            </TouchableOpacity>
          )}
          {statsView === "base" ? (
            <View style={styles.statsWrapper}>
              <View style={styles.baseStatsContainer}>
                <Text style={styles.statsTitle}>
                  Base Stats{" "}
                  <Text style={[styles.statsTotal, (statsTotal === 70 && styles.statsMax) || styles.statsRemaining]}>
                    {statsTotal}/70
                  </Text>
                </Text>
                {Object.entries(baseStats).map(([label, value]) => (
                  <View key={label} style={styles.statRow}>
                    <Text style={styles.statsLabel}>{label}</Text>
                    <TouchableOpacity
                      onPress={() => handleChange(label, -1)}
                      style={styles.arrow}
                      disabled={value <= 4}
                    >
                      <Text style={[styles.arrowText, value <= 4 && styles.disabledArrow]}>◀</Text>
                    </TouchableOpacity>
                    <Text style={styles.statsValue}>{value}</Text>
                    <TouchableOpacity
                      onPress={() => handleChange(label, 1)}
                      style={styles.arrow}
                      disabled={(value >= 12 && label !== "Hlth") || statsTotal === 70}
                    >
                      <Text
                        style={[
                          styles.arrowText,
                          ((value >= 12 && label !== "Hlth") || statsTotal === 70) && styles.disabledArrow,
                        ]}
                      >
                        ▶
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.weaponStatsContainer}>
                <Text style={styles.statsTitle}>Base Attack</Text>
                <View style={[styles.weapon, invalidFields.includes("weaponValue") && styles.invalidInput]}>
                  <DropDownPicker
                    open={openWeapon}
                    placeholder={typeValue === null ? "Pick character type" : "pick a weapon"}
                    style={{
                      backgroundColor: "#D4B36C",
                      borderColor: "#8C6A41",
                    }}
                    dropDownContainerStyle={{
                      backgroundColor: "#3B2A1A",
                      borderColor: "#8C6A41",
                    }}
                    placeholderStyle={{
                      color: "black",
                    }}
                    labelStyle={{
                      color: "#EBD9B4",
                    }}
                    listItemContainerStyle={{
                      backgroundColor: "#3B2A1A",
                    }}
                    listItemLabelStyle={{
                      color: "#EBD9B4",
                    }}
                    value={weaponValue}
                    items={typeValue === "mage" ? magicWeapons : meleeWeapons}
                    setOpen={setOpenWeapon}
                    setValue={setWeaponValue}
                    onOpen={() => {
                      setOpenSize(false);
                      setOpenType(false);
                    }}
                    onChangeValue={(val) => {
                      if (val) {
                        setInvalidFields((prev) => prev.filter((f) => f !== "weaponValue"));
                        setSelectedAttacks([]);
                        setSelectedSpecials([]);
                      }
                    }}
                    zIndex={3000}
                    zIndexInverse={1000}
                    disabled={typeValue === null}
                  />
                </View>
                {weaponValue === null ? (
                  <Text style={styles.weaponName}>No weapon selected</Text>
                ) : (
                  Object.entries(weaponsData.weapons[weaponValue].stats).map(([label, value]) => (
                    <View key={label} style={styles.statRow}>
                      <Text style={styles.statsLabel}>{label}</Text>
                      <Text style={styles.statsValue}>{value}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          ) : statsView === "atk" ? (
            <View style={styles.attacksContainer}>
              {weaponValue === null ? (
                <Text style={{ color: "#999", fontSize: 14, textAlign: "center", marginTop: 20 }}>
                  Pick a weapon first
                </Text>
              ) : (
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingBottom: 6 }}
                  showsVerticalScrollIndicator={false}
                >
                  {abilityList.map((ability) => {
                    const isSelected = selectedAttacks.includes(ability.name);
                    const isFull = selectedAttacks.length >= 2 && !isSelected;
                    return (
                      <TouchableOpacity
                        key={ability.name}
                        activeOpacity={isFull ? 1 : 0.7}
                        onPress={() => !isFull && toggleAbility(ability.name)}
                        style={{
                          backgroundColor: isSelected ? "#4A6741" : "#3B2A1A",
                          borderColor: isSelected ? "#7CFC00" : isFull ? "#555" : "#8C6A41",
                          borderWidth: isSelected ? 2 : 1,
                          borderRadius: 10,
                          padding: 10,
                          marginHorizontal: 6,
                          marginVertical: 3,
                          opacity: isFull ? 0.45 : 1,
                        }}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <Text
                            style={{
                              color: isSelected ? "#7CFC00" : "#EBD9B4",
                              fontSize: 15,
                              fontWeight: "bold",
                              flex: 1,
                            }}
                          >
                            {isSelected ? "✓ " : ""}
                            {ability.name}
                          </Text>
                          <Text style={{ color: "#D4B36C", fontSize: 12, fontWeight: "bold" }}>{ability.type}</Text>
                        </View>
                        <Text style={{ color: isSelected ? "#C5E6C0" : "#A89272", fontSize: 11, marginTop: 3 }}>
                          {ability.effect}
                        </Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 5, gap: 10 }}>
                          {ability["hit%"] != null && (
                            <Text style={{ color: "#999", fontSize: 10 }}>Hit: {ability["hit%"]}%</Text>
                          )}
                          {ability.str != null && (
                            <Text style={{ color: ability.str > 0 ? "#7CFC00" : "#FF6B6B", fontSize: 10 }}>
                              Str: {ability.str > 0 ? "+" : ""}
                              {ability.str}
                            </Text>
                          )}
                          {ability.skl != null && (
                            <Text style={{ color: ability.skl > 0 ? "#7CFC00" : "#FF6B6B", fontSize: 10 }}>
                              Skl: {ability.skl > 0 ? "+" : ""}
                              {ability.skl}
                            </Text>
                          )}
                          {ability.spd != null && (
                            <Text style={{ color: ability.spd > 0 ? "#7CFC00" : "#FF6B6B", fontSize: 10 }}>
                              Spd: {ability.spd > 0 ? "+" : ""}
                              {ability.spd}
                            </Text>
                          )}
                          {ability.lck != null && (
                            <Text style={{ color: ability.lck > 0 ? "#7CFC00" : "#FF6B6B", fontSize: 10 }}>
                              Lck: {ability.lck > 0 ? "+" : ""}
                              {ability.lck}
                            </Text>
                          )}
                          {ability.range != null && (
                            <Text style={{ color: "#999", fontSize: 10 }}>Range: {ability.range}</Text>
                          )}
                          {ability.uses != null && (
                            <Text style={{ color: "#999", fontSize: 10 }}>Uses: {ability.uses}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
              {invalidFields.includes("abilities") && (
                <Text style={{ color: "#FF6B6B", fontSize: 12, textAlign: "center", marginTop: 3 }}>
                  Pick 2 abilities
                </Text>
              )}
            </View>
          ) : statsView === "special" ? (
            <View style={styles.specialMovesContainer}>
              {weaponValue === null ? (
                <Text style={{ color: "#999", fontSize: 14, textAlign: "center", marginTop: 20 }}>
                  Pick a weapon first
                </Text>
              ) : (
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingBottom: 6 }}
                  showsVerticalScrollIndicator={false}
                >
                  {specialMovesList.map((move) => {
                    const isSelected = selectedSpecials.includes(move.name);
                    const isFull = selectedSpecials.length >= 3 && !isSelected;
                    return (
                      <TouchableOpacity
                        key={move.name}
                        activeOpacity={isFull ? 1 : 0.7}
                        onPress={() => !isFull && toggleSpecialMove(move.name)}
                        style={{
                          backgroundColor: isSelected ? "#4A6741" : "#3B2A1A",
                          borderColor: isSelected ? "#7CFC00" : isFull ? "#555" : "#8C6A41",
                          borderWidth: isSelected ? 2 : 1,
                          borderRadius: 10,
                          padding: 10,
                          marginHorizontal: 6,
                          marginVertical: 3,
                          opacity: isFull ? 0.45 : 1,
                        }}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <Text
                            style={{
                              color: isSelected ? "#7CFC00" : "#EBD9B4",
                              fontSize: 15,
                              fontWeight: "bold",
                              flex: 1,
                            }}
                          >
                            {isSelected ? "✓ " : ""}
                            {move.name}
                          </Text>
                          <Text style={{ color: "#D4B36C", fontSize: 12, fontWeight: "bold" }}>{move.effect}</Text>
                        </View>
                        <Text style={{ color: isSelected ? "#C5E6C0" : "#A89272", fontSize: 11, marginTop: 3 }}>
                          {move.description}
                        </Text>
                        <View style={{ flexDirection: "row", marginTop: 5, gap: 12 }}>
                          <Text style={{ color: "#999", fontSize: 10 }}>Range: {move.range}</Text>
                          <Text style={{ color: "#999", fontSize: 10 }}>Turns: {move.turns}</Text>
                          <Text style={{ color: "#999", fontSize: 10 }}>Uses: {move.uses}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
              {invalidFields.includes("specials") && (
                <Text style={{ color: "#FF6B6B", fontSize: 12, textAlign: "center", marginTop: 3 }}>Pick 3 moves</Text>
              )}
            </View>
          ) : null}
          <TouchableOpacity style={styles.submitBtn} onPress={() => handleSubmit()}>
            <Text>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2B2B2B",
  },
  limitNotice: {
    backgroundColor: "#3A3A3A",
    padding: 8,
    margin: 10,
    borderRadius: 8,
  },
  limitNoticeText: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "600",
  },
  charCard: {
    backgroundColor: "#3C3C3C",
    flex: 1,
    borderRadius: 50,
    margin: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  charName: {
    position: "absolute",
    width: "45%",
    backgroundColor: "#F5F0D5",
    color: "#3B2F1E",
    padding: 16,
    fontSize: 16,
    borderRadius: 8,
    top: "1%",
    left: "10%",
  },
  charLabel: {
    position: "absolute",
    width: "30%",
    backgroundColor: "#F5F0D5",
    color: "#3B2F1E",
    padding: 16,
    fontSize: 16,
    borderRadius: 8,
    top: "1%",
    left: "60%",
  },
  charImage: {
    position: "absolute",
    height: "15%",
    width: "30%",
    backgroundColor: "#F5F0D5",
    borderRadius: 12,
    top: "7%",
    left: "10%",
    justifyContent: "center",
    alignItems: "center",
  },
  charLvlLabel: {
    position: "absolute",
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    top: "8%",
    right: "30%",
  },
  charMoveLabel: {
    position: "absolute",
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    top: "13%",
    right: "30%",
  },
  charSizeLabel: {
    position: "absolute",
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    top: "18%",
    right: "30%",
  },
  charLvl: {
    position: "absolute",
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    top: "8%",
    right: "25%",
  },
  charMove: {
    position: "absolute",
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    top: "13%",
    right: "25%",
  },
  charSize: {
    position: "absolute",
    width: "20%",
    top: "17%",
    right: "10%",
    backgroundColor: "#F5F0D5",
    borderRadius: 8,
  },
  charType: {
    position: "absolute",
    width: "45%",
    top: "23%",
    backgroundColor: "#F5F0D5",
    borderRadius: 8,
  },
  baseStatsBtn: {
    position: "absolute",
    height: "5%",
    width: "30%",
    top: "32%",
    left: "3%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  atkStatsBtn: {
    position: "absolute",
    height: "5%",
    width: "30%",
    top: "32%",
    left: "33%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  specialMovesBtn: {
    position: "absolute",
    height: "5%",
    width: "30%",
    top: "32%",
    left: "63%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  notPressed: {
    backgroundColor: "#C9A66B",
    borderWidth: 3,
    borderTopColor: "#FFF3D1",
    borderLeftColor: "#FFF3D1",
    borderBottomColor: "#6B4C2D",
    borderRightColor: "#6B4C2D",
  },
  pressed: {
    backgroundColor: "#D4B36C",
    borderWidth: 3,
    borderTopColor: "#6B4C2D",
    borderLeftColor: "#6B4C2D",
    borderBottomColor: "#FFF3D1",
    borderRightColor: "#FFF3D1",
  },
  statsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    width: "100%",
    position: "absolute",
    top: "40%",
  },
  baseStatsContainer: {
    backgroundColor: "#F5F0D5",
    borderRadius: 16,
    padding: 16,
    flex: 1,
    marginRight: 5,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  statsTotal: {
    fontSize: 15,
  },
  statsMax: {
    color: "red",
  },
  statsRemaining: {
    color: "green",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  statsLabel: {
    width: 50,
    fontSize: 16,
  },
  arrow: {
    paddingHorizontal: 10,
  },
  disabledArrow: {
    color: "red",
  },
  arrowText: {
    fontSize: 18,
  },
  statsValue: {
    width: 30,
    textAlign: "center",
    fontSize: 16,
  },
  weaponStatsContainer: {
    backgroundColor: "#F5F0D5",
    borderRadius: 16,
    padding: 16,
    flex: 1,
    marginLeft: 5,
  },
  weaponName: {
    fontSize: 16,
    fontStyle: "italic",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  label: {
    width: 80,
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  attacksContainer: {
    position: "absolute",
    top: "42%",
    bottom: "10%",
    left: 0,
    right: 0,
    paddingHorizontal: 10,
  },
  specialMovesContainer: {
    position: "absolute",
    top: "42%",
    bottom: "10%",
    left: 0,
    right: 0,
    paddingHorizontal: 10,
  },
  submitBtn: {
    backgroundColor: "#D4B36C",
    borderWidth: 3,
    borderColor: "#6B4C2D",
    position: "absolute",
    bottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
  },

  invalidInput: {
    borderWidth: 2,
    borderColor: "red",
  },
});
