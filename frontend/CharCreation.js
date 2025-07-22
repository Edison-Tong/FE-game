import { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Keyboard } from "react-native";
import { weaponsData } from "./WeaponsData.js";

import DropDownPicker from "react-native-dropdown-picker";

export default function CharCreation() {
  const [openSize, setOpenSize] = useState(false);
  const [openType, setOpenType] = useState(false);
  const [openWeapon, setOpenWeapon] = useState(false);
  const [openAbility1, setOpenAbility1] = useState(false);
  const [openAbility2, setOpenAbility2] = useState(false);

  const [sizeValue, setSizeValue] = useState(null);
  const [bonus, setBonus] = useState(0);
  const sizeItems = [
    { label: "1", value: 1 },
    { label: "2", value: 2 },
    { label: "3", value: 3 },
    { label: "4", value: 4 },
  ];
  const [typeValue, setTypeValue] = useState(null);
  const typeItems = [
    { label: "Regular", value: "regular" },
    { label: "Mage", value: "mage" },
  ];
  const moveAmount = { regular: 5 + bonus, mage: 4 + bonus };
  const [weaponValue, setWeaponValue] = useState(null);
  const meleeWeapons = Object.values(weaponsData.weapons).filter((weapon) => weapon.type === "melee");
  const magicWeapons = Object.values(weaponsData.weapons).filter((weapon) => weapon.type === "magick");
  const [statsView, setStatsView] = useState("base");
  const initialBaseStats = {
    Hlth: 12,
    Str: 1,
    Def: 2,
    Mgk: 3,
    Res: 4,
    Spd: 5,
    Skl: 6,
    Knl: 7,
    Lck: 8,
  };
  const [baseStats, setBaseStats] = useState(initialBaseStats);
  const [ability1, setAbility1] = useState(null);
  const [ability2, setAbility2] = useState(null);

  const currentAbilities = weaponsData.weaponAbilities[weaponValue] || [];

  const abilityOptions = currentAbilities.map((ability) => ({
    label: ability.name,
    value: ability.name,
    disabled: ability.name === ability1 || ability.name === ability2,
  }));

  useEffect(() => {
    if (!weaponValue) {
      setBonus(0);
      return;
    }

    setBonus(weaponValue === "wind" ? 1 : 0);
  }, [weaponValue]);

  useEffect(() => {
    setWeaponValue(null);
  }, [typeValue]);

  const handleChange = (key, delta) => {
    setBaseStats((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta), // prevent negative stats
    }));
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View key="char1" style={styles.container}>
        <View style={styles.charCard}>
          <TextInput style={styles.charName} placeholder={"character name"} />
          <TextInput style={styles.charLabel} placeholder={"character name"} />
          <View style={styles.charImage}>
            <Text>Character Image</Text>
          </View>
          <Text style={styles.charLvlLabel}>Level:</Text>
          <Text style={styles.charMoveLabel}>Move:</Text>
          <Text style={styles.charSizeLabel}>Size:</Text>
          <Text style={styles.charLvl}>1</Text>
          <Text style={styles.charMove}>{moveAmount[typeValue]}</Text>
          <View style={styles.charSize}>
            <DropDownPicker
              open={openSize}
              placeholder="#"
              value={sizeValue}
              items={sizeItems}
              setOpen={setOpenSize}
              setValue={setSizeValue}
              zIndex={3000}
              zIndexInverse={1000}
            />
          </View>
          <View style={styles.charType}>
            <DropDownPicker
              open={openType}
              placeholder="Character Type"
              value={typeValue}
              items={typeItems}
              setOpen={setOpenType}
              setValue={setTypeValue}
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
                <Text style={styles.statsTitle}>Base Stats</Text>
                {Object.entries(baseStats).map(([label, value]) => (
                  <View key={label} style={styles.statRow}>
                    <Text style={styles.statsLabel}>{label}</Text>
                    <TouchableOpacity onPress={() => handleChange(label, -1)} style={styles.arrow}>
                      <Text style={styles.arrowText}>◀</Text>
                    </TouchableOpacity>
                    <Text style={styles.statsValue}>{value}</Text>
                    <TouchableOpacity onPress={() => handleChange(label, 1)} style={styles.arrow}>
                      <Text style={styles.arrowText}>▶</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.weaponStatsContainer}>
                <Text style={styles.statsTitle}>Base Attack</Text>
                <View style={styles.weapon}>
                  <DropDownPicker
                    open={openWeapon}
                    placeholder={typeValue === null ? "Pick character type" : "pick a weapon"}
                    value={weaponValue}
                    items={typeValue === "mage" ? magicWeapons : meleeWeapons}
                    setOpen={setOpenWeapon}
                    setValue={setWeaponValue}
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
              <View style={styles.attackContainer}>
                <DropDownPicker
                  open={openAbility1}
                  placeholder={weaponValue === null ? "Pick a weapon first" : "Ability 1"}
                  value={ability1}
                  items={abilityOptions}
                  setOpen={setOpenAbility1}
                  setValue={setAbility1}
                  zIndex={3000}
                  zIndexInverse={1000}
                  disabled={weaponValue === null}
                  disabledItemLabelStyle={{ color: "gray" }}
                />
              </View>
              <View style={styles.attackContainer}>
                <DropDownPicker
                  open={openAbility2}
                  placeholder={weaponValue === null ? "Pick a weapon first" : "Ability 2"}
                  value={ability2}
                  items={abilityOptions}
                  setOpen={setOpenAbility2}
                  setValue={setAbility2}
                  zIndex={3000}
                  zIndexInverse={1000}
                  disabled={weaponValue === null}
                  disabledItemLabelStyle={{ color: "gray" }}
                />
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "red",
  },
  charCard: {
    backgroundColor: "grey",
    flex: 1,
    borderRadius: 50,
    margin: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  charName: {
    position: "absolute",
    width: "45%",
    backgroundColor: "#fff",
    padding: 10,
    fontSize: 16,
    top: "1%",
    left: "10%",
  },
  charLabel: {
    position: "absolute",
    width: "30%",
    backgroundColor: "#fff",
    padding: 10,
    fontSize: 16,
    top: "1%",
    left: "60%",
  },
  charImage: {
    position: "absolute",
    height: "15%",
    width: "30%",
    backgroundColor: "white",
    top: "7%",
    left: "10%",
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
  charLvl: { position: "absolute", color: "white", fontSize: 20, fontWeight: "bold", top: "8%", right: "25%" },
  charMove: { position: "absolute", color: "white", fontSize: 20, fontWeight: "bold", top: "13%", right: "25%" },
  charSize: {
    position: "absolute",
    width: "20%",
    top: "17%",
    right: "10%",
  },
  charType: {
    position: "absolute",
    width: "40%",
    height: "5%",
    top: "23%",
  },
  baseStatsBtn: {
    position: "absolute",
    backgroundColor: "darkgrey",
    height: "5%",
    width: "30%",
    top: "32%",
    left: "3%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "black",
  },
  atkStatsBtn: {
    position: "absolute",
    backgroundColor: "lightgrey",
    height: "5%",
    width: "30%",
    top: "32%",
    left: "33%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "black",
  },
  notPressed: {
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderTopColor: "#fff", // Light on top
    borderLeftColor: "#fff",
    borderBottomColor: "#666", // Dark on bottom
    borderRightColor: "#666",
    backgroundColor: "#ccc",
  },
  pressed: {
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderTopColor: "#666", // Dark on top
    borderLeftColor: "#666",
    borderBottomColor: "#fff", // Light on bottom
    borderRightColor: "#fff",
    backgroundColor: "#ccc",
  },
  statsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    width: "100%", // ensure full width is used
    position: "absolute",
    top: "40%",
  },
  baseStatsContainer: {
    backgroundColor: "white",
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
  arrowText: {
    fontSize: 18,
  },
  statsValue: {
    width: 30,
    textAlign: "center",
    fontSize: 16,
  },
  weaponStatsContainer: {
    backgroundColor: "#f0f4ff",
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
    backgroundColor: "white",
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
});
