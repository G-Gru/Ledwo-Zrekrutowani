const BASE_URL = import.meta.env.VITE_API_URL;
export const apiClient = async (url, options) => {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error("API error");
  }

  return response.json();
};