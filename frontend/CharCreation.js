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
  const [openAbility1, setOpenAbility1] = useState(false);
  const [openAbility2, setOpenAbility2] = useState(false);
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
    return [
      { label: sizeCounts[1] >= 1 ? "1 (full)" : "1", value: 1 },
      { label: sizeCounts[2] >= 2 ? "2 (full)" : "2", value: 2 },
      { label: sizeCounts[3] >= 2 ? "3 (full)" : "3", value: 3 },
      { label: sizeCounts[4] >= 1 ? "4 (full)" : "4", value: 4 },
    ];
  }, [sizeCounts]);

  const computedTypeItems = useMemo(() => {
    return [
      { label: "Melee", value: "melee" },
      { label: mageCount >= 2 ? "Mage (full)" : "Mage", value: "mage" },
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

  const attackStats = ["hit%", "Str", "Def", "Mgk", "Res", "Spd", "Skl", "Knl", "Lck", "range"];
  const [baseStats, setBaseStats] = useState(initialBaseStats);
  const [ability1, setAbility1] = useState(null);
  const [ability2, setAbility2] = useState(null);

  const currentAbilities = weaponsData.weaponAbilities[weaponValue] || [];

  const abilityOptions = useMemo(() => {
    const abilities = weaponsData.weaponAbilities[weaponValue] || [];
    return abilities.map((a) => ({
      label: a.name,
      value: a.name,
      disabled: a.name === ability1 || a.name === ability2,
    }));
  }, [weaponValue, ability1, ability2, weaponsData]);

  const [selectedAbilities, setSelectedAbilities] = useState(
    {
      ability1: null,
      ability2: null,
    },
    weaponValue
  );

  useEffect(() => {
    if (!weaponValue) {
      setBonus(0);
      return;
    }

    setBonus(weaponValue === "wind" ? 1 : 0);
  });

  useEffect(() => {
    setWeaponValue(null);
  }, [typeValue]);

  const handleChange = (key, delta) => {
    setBaseStats((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
    setStatsTotal((prev) => prev + delta);
  };

  useEffect(() => {
    const updatedAbilities = {};

    if (ability1 && weaponsData.weaponAbilities[weaponValue]) {
      const found1 = weaponsData.weaponAbilities[weaponValue].find((ability) => ability.name === ability1);
      updatedAbilities.ability1 = found1 || null;
    }

    if (ability2 && weaponsData.weaponAbilities[weaponValue]) {
      const found2 = weaponsData.weaponAbilities[weaponValue].find((ability) => ability.name === ability2);
      updatedAbilities.ability2 = found2 || null;
    }

    if (Object.keys(updatedAbilities).length > 0) {
      setSelectedAbilities((prev) => ({
        ...prev,
        ...updatedAbilities,
      }));
    }
  }, [ability1, ability2, weaponValue]);

  const handleSubmit = async () => {
    const missing = [];

    if (!name) missing.push("name");
    if (!label) missing.push("label");
    if (!typeValue) missing.push("typeValue");
    if (!sizeValue) missing.push("sizeValue");
    if (!weaponValue) missing.push("weaponValue");
    if (!ability1) missing.push("ability1");
    if (!ability2) missing.push("ability2");

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
          abilities: [ability1, ability2],
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
                    onChangeValue={(val) => {
                      if (val) {
                        setInvalidFields((prev) => prev.filter((f) => f !== "weaponValue"));
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
            <View style={styles.attackWrapper}>
              <View style={[styles.attackContainer, invalidFields.includes("ability1") && styles.invalidInput]}>
                <DropDownPicker
                  open={openAbility1}
                  placeholder={weaponValue === null ? "Pick a weapon first" : "Ability 1"}
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
                  value={ability1}
                  items={abilityOptions}
                  setOpen={setOpenAbility1}
                  setValue={setAbility1}
                  onChangeValue={(val) => {
                    if (val) {
                      setInvalidFields((prev) => prev.filter((f) => f !== "ability1"));
                    }
                  }}
                  zIndex={3000}
                  zIndexInverse={1000}
                  disabled={weaponValue === null}
                  disabledItemLabelStyle={{ color: "gray" }}
                />
                {ability1 === null || !selectedAbilities.ability1 ? (
                  <Text style={styles.attackTitle}>No ability selected</Text>
                ) : (
                  attackStats.map((stat, index) => {
                    const value = selectedAbilities.ability1[stat.toLowerCase()] ?? 0;
                    return (
                      <View key={index} style={styles.statRow}>
                        <Text style={styles.statsLabel}>{stat}:</Text>
                        <Text style={styles.statsValue}>{value}</Text>
                      </View>
                    );
                  })
                )}
              </View>
              <View style={[styles.attackContainer, invalidFields.includes("ability2") && styles.invalidInput]}>
                <DropDownPicker
                  open={openAbility2}
                  placeholder={weaponValue === null ? "Pick a weapon first" : "Ability 2"}
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
                  value={ability2}
                  items={abilityOptions}
                  setOpen={setOpenAbility2}
                  setValue={setAbility2}
                  onChangeValue={(val) => {
                    if (val) {
                      setInvalidFields((prev) => prev.filter((f) => f !== "ability2"));
                    }
                  }}
                  zIndex={3000}
                  zIndexInverse={1000}
                  disabled={weaponValue === null}
                  disabledItemLabelStyle={{ color: "gray" }}
                />
                {ability2 === null || !selectedAbilities.ability2 ? (
                  <Text style={styles.attackTitle}>No ability selected</Text>
                ) : (
                  attackStats.map((stat, index) => {
                    const value = selectedAbilities.ability2[stat.toLowerCase()] ?? 0;
                    return (
                      <View key={index} style={styles.statRow}>
                        <Text style={styles.statsLabel}>{stat}:</Text>
                        <Text style={styles.statsValue}>{value}</Text>
                      </View>
                    );
                  })
                )}
              </View>
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
    padding: 10,
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
    padding: 10,
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
    borderRadius: 10,
  },
  atkStatsBtn: {
    position: "absolute",
    height: "5%",
    width: "30%",
    top: "32%",
    left: "33%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
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
    padding: 10,
    width: "100%",
    position: "absolute",
    top: "40%",
  },
  baseStatsContainer: {
    backgroundColor: "#F5F0D5",
    borderRadius: 10,
    padding: 10,
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
    borderRadius: 10,
    padding: 10,
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
  attackWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    top: "15%",
  },
  attackContainer: {
    backgroundColor: "#F5F0D5",
    borderRadius: 10,
    padding: 12,
    margin: 8,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  attackTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333",
  },
  attackText: {
    fontSize: 14,
    color: "#444",
    marginVertical: 2,
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
