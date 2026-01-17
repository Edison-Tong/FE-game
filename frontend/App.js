import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, AuthContext } from "./AuthContext";
import { useEffect, useContext } from "react";
import { Button, Alert } from "react-native";
import { BACKEND_URL } from "@env";

import Login from "./Login";
import Register from "./Register";
import HomeScreen from "./HomeScreen";
import TeamViewScreen from "./TeamViewScreen";
import CharCreation from "./CharCreation";
import GameLobby from "./GameLobby";
import MatchmakingScreen from "./MatchmakingScreen";
import BattleScreen from "./BattleScreen";

const Stack = createNativeStackNavigator();
export default function App() {
  // Warm up the backend
  useEffect(() => {
    fetch(`${BACKEND_URL}/ping`)
      .then(() => console.log("Backend warmed up"))
      .catch((err) => console.log("Warm-up failed:", err));
  }, []);

  // LeaveRoomButton consumes AuthContext inside provider
  const LeaveRoomButton = ({ navigation }) => {
    const { roomId, setRoomId } = useContext(AuthContext);

    const doLeave = async () => {
      if (roomId) {
        try {
          await fetch(`${BACKEND_URL}/delete-room`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId }),
          });
        } catch (err) {
          console.log("Error deleting room:", err);
        }
      }
      // clear local context state and navigate back
      if (setRoomId) setRoomId(null);
      navigation.pop(1);
    };

    return (
      <Button
        title="Leave Room"
        onPress={() => {
          Alert.alert("Leave Battle", "Are you sure you want to leave the battle? This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            { text: "Yes, Leave", style: "destructive", onPress: doLeave },
          ]);
        }}
      />
    );
  };

  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerBackTitleVisible: false, title: "", headerShown: false }}
          />
          <Stack.Screen name="Register" component={Register} options={{ headerBackTitleVisible: false }} />
          <Stack.Screen
            name="HomeScreen"
            component={HomeScreen}
            options={({ navigation }) => ({
              headerBackVisible: false,
              title: "",
              headerLeft: () => (
                <Button
                  title="Logout"
                  onPress={() =>
                    navigation.reset({
                      index: 0,
                      routes: [{ name: "Login" }],
                    })
                  }
                />
              ),
              headerRight: () => <Button title="Battle" onPress={() => navigation.navigate("GameLobby")} />,
            })}
          />

          <Stack.Screen
            name="TeamViewScreen"
            component={TeamViewScreen}
            options={{ headerBackTitleVisible: false, title: "" }}
          />
          <Stack.Screen
            name="CharCreation"
            component={CharCreation}
            options={{ headerBackTitleVisible: false, title: "" }}
          />
          <Stack.Screen name="GameLobby" component={GameLobby} options={{ headerBackTitleVisible: false, title: "" }} />
          <Stack.Screen
            name="MatchmakingScreen"
            component={MatchmakingScreen}
            options={({ navigation }) => ({
              headerBackVisible: false,
              title: "",
              headerLeft: () => <LeaveRoomButton navigation={navigation} />,
            })}
          />
          <Stack.Screen
            name="BattleScreen"
            component={BattleScreen}
            options={({ navigation }) => ({
              headerBackVisible: false,
              title: "",
              headerLeft: () => <LeaveRoomButton navigation={navigation} />,
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
