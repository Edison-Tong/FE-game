import React, { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // user will be { id, username }
  const [roomId, setRoomId] = useState(null);

  return <AuthContext.Provider value={{ user, setUser, roomId, setRoomId }}>{children}</AuthContext.Provider>;
};
