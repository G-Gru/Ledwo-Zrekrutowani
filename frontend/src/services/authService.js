import { apiClient } from "../api/client";

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Logowanie użytkownika
 * Endpoint: POST /api/auth/login
 * Oczekiwana odpowiedź: { token: string, user: { id, email, name } }
 */
export const login = async (email, password) => {
  try {
    const response = await apiClient(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    return response;
  } catch (error) {
    throw new Error(error.message || "Logowanie nie powiodło się");
  }
};

/**
 * Rejestracja nowego użytkownika
 * Endpoint: POST /api/auth/register
 * Oczekiwana odpowiedź: { token: string, user: { id, email, name } }
 */
export const register = async (userData) => {
  try {
    const response = await apiClient(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    return response;
  } catch (error) {
    throw new Error(error.message || "Rejestracja nie powiodła się");
  }
};
