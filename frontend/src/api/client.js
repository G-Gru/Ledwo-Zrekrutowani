const BASE_URL = import.meta.env.VITE_API_URL;
export const apiClient = async (url, options) => {
  const response = await fetch(url, options);

  if (!response.ok) {
    let errorMessage = "Wystąpił błąd po stronie serwera.";

    try {
      const errorData = await response.json();
      
      errorMessage = errorData.detail || Object.values(errorData)[0][0] || "API error";
    } catch (e) {
      console.error("Failed to parse error response", e);
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
};