
export interface WeatherData {
  temp: number;
  condition: string;
  windSpeed: number;
  humidity: number;
  weatherCode: number;
}

/**
 * Mapeia os códigos WMO para descrições legíveis em Português
 */
export const getWeatherDescription = (code: number): string => {
  if (code === 0) return "Céu Limpo";
  if (code >= 1 && code <= 3) return "Parcialmente Nublado";
  if (code >= 45 && code <= 48) return "Nevoeiro";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code >= 61 && code <= 65) return "Chuva";
  if (code >= 71 && code <= 77) return "Neve";
  if (code >= 80 && code <= 82) return "Aguaceiros";
  if (code >= 95) return "Trovoada";
  return "Instável";
};

export const fetchCurrentWeather = async (lat: number, lng: number): Promise<WeatherData> => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&wind_speed_unit=kmh`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Falha ao obter clima");
    
    const data = await response.json();
    const current = data.current;
    
    return {
      temp: Math.round(current.temperature_2m),
      condition: getWeatherDescription(current.weather_code),
      windSpeed: Math.round(current.wind_speed_10m),
      humidity: current.relative_humidity_2m,
      weatherCode: current.weather_code
    };
  } catch (error) {
    console.error("Weather fetch error:", error);
    throw error;
  }
};
