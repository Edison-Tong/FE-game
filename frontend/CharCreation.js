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
          <Text style={styles.charMove}>4</Text>
          <View style={styles.charSize}>
            <DropDownPicker
              open={openDropdown === "size"}
              value={sizeValue}
              items={sizeItems}
              setOpen={(isOpen) => setOpenDropdown(isOpen ? "size" : null)}
              setValue={setSizeValue}
              zIndex={3000}
              zIndexInverse={1000}
            />
          </View>
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
    width: 50,
    top: "17%",
    right: "15%",
  },
});
