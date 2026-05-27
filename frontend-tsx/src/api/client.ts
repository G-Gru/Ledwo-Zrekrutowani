export const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000'

export const apiClient = async <T = unknown>(url: string, options: RequestInit): Promise<T> => {
  const response = await fetch(url, options)
  if (!response.ok) {
    let errorMessage = 'Wystąpił błąd po stronie serwera.'
    try {
      const errorData = await response.json()
      errorMessage = errorData.detail || Object.values(errorData as object)[0]?.[0] || 'API error'
    } catch {}
    throw new Error(errorMessage)
  }
  return response.json() as Promise<T>
}
