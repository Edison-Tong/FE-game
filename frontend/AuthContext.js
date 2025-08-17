import React, { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // user will be { id, username }

  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
};
