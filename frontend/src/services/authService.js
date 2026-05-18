import { apiClient } from "../api/client";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const decodeBase64Url = (value) => {
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64);
    return decodeURIComponent(
      decoded
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join("")
    );
  } catch {
    return null;
  }
};

const parseJwtPayload = (token) => {
  if (!token || token.split(".").length !== 3) return null;
  const payload = token.split(".")[1];
  const decoded = decodeBase64Url(payload);
  if (!decoded) return null;

  try {
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return false;
  return Math.floor(Date.now() / 1000) >= payload.exp;
};

export const getAccessToken = () => {
  const token = localStorage.getItem('user-access-token');
  if (!token) return null;
  return token;
};

export const getRefreshToken = () => localStorage.getItem('user-refresh-token');

export const getUser = () => {
  const user = localStorage.getItem('user-data');
  return user ? JSON.parse(user) : null;
};

export const getUserType = () => getUser()?.type || null;

export const getUserRole = () => getUser()?.role || null;

export const isLoggedIn = () => !!getAccessToken();

/**
 * Logowanie użytkownika
 * Endpoint: POST /api/auth/login
 * Oczekiwana odpowiedź: { token: string, user: { id, email, phone, first_name, last_name } }
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

        // add to local storage
        if (response.access && response.refresh) {
            localStorage.setItem('user-access-token', response["access"]);
            localStorage.setItem('user-refresh-token', response["refresh"]);
        }
        if (response.user) {
            localStorage.setItem('user-data', JSON.stringify(response.user));
        }
        console.log(response.user)
        return response;
    } catch (error) {
        throw new Error(error.message || "Logowanie nie powiodło się");
    }
};

export const logout = () => {
    localStorage.removeItem('user-access-token');
    localStorage.removeItem('user-refresh-token');
    localStorage.removeItem('user-data');
  window.location.href = '/studies';
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

// Token refresh logic
export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    logout();
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Refresh failed");
    }

    const data = await response.json();
    
    localStorage.setItem('user-access-token', data.access);
    if (data.refresh) {
      localStorage.setItem('user-refresh-token', data.refresh);
    }
    
    return data.access;
  } catch (error) {
    logout();
    return null;
  }
};