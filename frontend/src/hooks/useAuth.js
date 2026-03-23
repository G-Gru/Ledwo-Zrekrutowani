import { login, register } from "../services/authService";

export const useAuth = () => {
  const handleLogin = async (email, password) => {
    const data = await login(email, password);
    if (data.token) {
      localStorage.setItem("token", data.token);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    }
    return data;
  };

  const handleRegister = async (email, password) => {
    const data = await register(email, password);
    if (data.token) {
      localStorage.setItem("token", data.token);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    }
    return data;
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem("token");
  };

  const getUser = () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  };

  return { 
    handleLogin, 
    handleRegister, 
    isAuthenticated,
    getUser 
  };
};