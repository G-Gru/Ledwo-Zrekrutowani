import * as authService from "../services/authService";

export const useAuth = () => {
  const handleLogin = async (email, password) => {
    const data = await authService.login(email, password);
    return data;
  };

  const handleRegister = async (userData) => {
    const data = await authService.register(userData);
    return data;
  };

  const isAuthenticated = () => authService.isLoggedIn();

  const getUser = () => authService.getUser();

  const logout = () => authService.logout();

  return { 
    handleLogin, 
    handleRegister, 
    isAuthenticated,
    getUser,
    logout
  };
};