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
            <View>
              <View style={styles.baseStatsContainer}>
                <Text>Base Stats</Text>
                <Text style={styles.statsLabels}>Hlth</Text>
                <Text style={styles.statsLabels}>Str</Text>
                <Text style={styles.statsLabels}>Def</Text>
                <Text style={styles.statsLabels}>Mgk</Text>
                <Text style={styles.statsLabels}>Res</Text>
                <Text style={styles.statsLabels}>Spd</Text>
                <Text style={styles.statsLabels}>Skl</Text>
                <Text style={styles.statsLabels}>Knl</Text>
                <Text style={styles.statsLabels}>Lck</Text>
              </View>
              <View style={styles.baseAtkContainer}>
                <Text>Base Attack</Text>
                <Text style={styles.statsLabels}>Hlth</Text>
                <Text style={styles.statsLabels}>Str</Text>
                <Text style={styles.statsLabels}>Def</Text>
                <Text style={styles.statsLabels}>Mgk</Text>
                <Text style={styles.statsLabels}>Res</Text>
                <Text style={styles.statsLabels}>Spd</Text>
                <Text style={styles.statsLabels}>Skl</Text>
                <Text style={styles.statsLabels}>Knl</Text>
                <Text style={styles.statsLabels}>Lck</Text>
              </View>
            </View>
          ) : statsView === "atk" ? (
            <View>
              <Text>Attack 1</Text>
              <Text>Damage Type</Text>
              <Text>Hit%</Text>
              <Text>Str</Text>
              <Text>Def</Text>
              <Text>Mgk</Text>
              <Text>Res</Text>
              <Text>Spd</Text>
              <Text>Skl</Text>
              <Text>Knl</Text>
              <Text>Lck</Text>
              <Text>Range</Text>
              <Text>Description of what the attack does</Text>
              <Text>Uses:</Text>
              <Text>Attack 2</Text>
              <Text>Damage Type</Text>
              <Text>Hlth</Text>
              <Text>Str</Text>
              <Text>Def</Text>
              <Text>Mgk</Text>
              <Text>Res</Text>
              <Text>Spd</Text>
              <Text>Skl</Text>
              <Text>Knl</Text>
              <Text>Lck</Text>
              <Text>Range</Text>
              <Text>Description of what the attack does</Text>
              <Text>Uses:</Text>
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
    position: "relative", // optional, default
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
    borderWidth: 1, // Thickness of the border
    borderColor: "black", // Border color
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
    borderWidth: 1, // Thickness of the border
    borderColor: "black", // Border color
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
  baseStatsContainer: {
    position: "absolute",
    backgroundColor: "white",
  },
  baseAtkContainer: {
    backgroundColor: "lightgrey",
  },
  statsLabels: {
    fontSize: 10,
  },
});
