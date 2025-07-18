import { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Keyboard } from "react-native";

import DropDownPicker from "react-native-dropdown-picker";

export default function CharCreation() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [sizeValue, setSizeValue] = useState(null);
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
  const moveAmount = { regular: 5, mage: 4 };
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

  const swordStats = {
    "Hit%": 85,
    Str: 2,
    Def: 0,
    Mgk: 0,
    Res: 0,
    Spd: 0,
    Skl: 1,
    Knl: 0,
    Lck: 0,
    Range: 1,
  };

  const attacks = [
    {
      name: "Attack 1",
      type: "Physical",
      hit: 90,
      stats: {
        Hlth: 0,
        Str: 3,
        Def: 1,
        Mgk: 0,
        Res: 0,
        Spd: 2,
        Skl: 1,
        Knl: 0,
        Lck: 1,
        Range: 1,
      },
      description: "A swift sword strike.",
      uses: 5,
    },
    {
      name: "Attack 2",
      type: "Magic",
      hit: 75,
      stats: {
        Hlth: 2,
        Str: 0,
        Def: 0,
        Mgk: 4,
        Res: 2,
        Spd: 0,
        Skl: 2,
        Knl: 1,
        Lck: 0,
        Range: 2,
      },
      description: "A fiery blast that burns enemies.",
      uses: 3,
    },
  ];

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
              open={openDropdown === "size"}
              placeholder="#"
              value={sizeValue}
              items={sizeItems}
              setOpen={(isOpen) => setOpenDropdown(isOpen ? "size" : null)}
              setValue={setSizeValue}
              zIndex={3000}
              zIndexInverse={1000}
            />
          </View>
          <View style={styles.charType}>
            <DropDownPicker
              open={openDropdown === "type"}
              placeholder="Character Type"
              value={typeValue}
              items={typeItems}
              setOpen={(isOpen) => setOpenDropdown(isOpen ? "type" : null)}
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
              <Text>Attack</Text>
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
                <Text style={styles.weaponName}>Sword</Text>
                {Object.entries(swordStats).map(([label, value]) => (
                  <View key={label} style={styles.statRow}>
                    <Text style={styles.statsLabel}>{label}</Text>
                    <Text style={styles.statsValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : statsView === "atk" ? (
            <View style={styles.attackWrapper}>
              {attacks.map((atk, index) => (
                <View key={index} style={styles.attackContainer}>
                  <Text style={styles.attackTitle}>{atk.name}</Text>
                  <Text style={styles.attackText}>Damage Type: {atk.type}</Text>
                  <Text style={styles.attackText}>Hit%: {atk.hit}</Text>

                  {Object.entries(atk.stats).map(([label, value]) => (
                    <Text key={label} style={styles.attackText}>
                      {label}: {value}
                    </Text>
                  ))}

                  <Text style={styles.attackText}>Description: {atk.description}</Text>
                  <Text style={styles.attackText}>Uses: {atk.uses}</Text>
                </View>
              ))}
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
