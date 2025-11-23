import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider } from "./AuthContext";
import { useEffect } from "react";
import { Button } from "react-native";
import { BACKEND_URL } from "@env";

import Login from "./Login";
import Register from "./Register";
import HomeScreen from "./HomeScreen";
import TeamViewScreen from "./TeamViewScreen";
import CharCreation from "./CharCreation";
import GameLobby from "./GameLobby";
import BattleScreen from "./BattleScreen";

const Stack = createNativeStackNavigator();
export default function App() {
  // Warm up the backend
  useEffect(() => {
    fetch(`${BACKEND_URL}/ping`)
      .then(() => console.log("Backend warmed up"))
      .catch((err) => console.log("Warm-up failed:", err));
  }, []);

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
              headerRight: () => <Button title="Battle" onPress={() => navigation.navigate("MatchmakingScreen")} />,
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
            name="BattleScreen"
            component={BattleScreen}
            options={{ headerBackTitleVisible: false, title: "" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
