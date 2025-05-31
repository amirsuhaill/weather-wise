
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Search, Wind, Droplets, Cloud, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface WeatherData {
  name: string;
  sys: { country: string };
  weather: Array<{ description: string; icon: string; main: string }>;
  main: { temp: number; humidity: number };
  wind: { speed: number };
  clouds: { all: number };
}

interface Coordinates {
  lat: number;
  lon: number;
}

const WeatherApp = () => {
  const [currentTab, setCurrentTab] = useState("location");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationGranted, setLocationGranted] = useState(false);

  const API_KEY = "168771779c71f3d64106d8a88376808a";

  useEffect(() => {
    checkStoredLocation();
  }, []);

  const checkStoredLocation = () => {
    const storedCoords = sessionStorage.getItem("userCoordinates");
    if (storedCoords) {
      const coordinates = JSON.parse(storedCoords);
      setLocationGranted(true);
      fetchWeatherByCoords(coordinates);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        sessionStorage.setItem("userCoordinates", JSON.stringify(coords));
        setLocationGranted(true);
        fetchWeatherByCoords(coords);
        toast.success("Location access granted!");
      },
      (error) => {
        setLoading(false);
        toast.error("Failed to get your location");
        console.error("Geolocation error:", error);
      }
    );
  };

  const fetchWeatherByCoords = async (coords: Coordinates) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error("Weather data not found");
      }
      
      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather data");
      toast.error("Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCity = async (city: string) => {
    if (!city.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error("City not found");
      }
      
      const data = await response.json();
      setWeatherData(data);
      toast.success(`Weather data loaded for ${data.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather data");
      toast.error("City not found or failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWeatherByCity(searchQuery);
    setSearchQuery("");
  };

  const getWeatherIcon = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  const getFlagUrl = (countryCode: string) => {
    return `https://flagcdn.com/32x24/${countryCode.toLowerCase()}.png`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-4">
      <div className="max-w-md mx-auto">
        <Card className="backdrop-blur-sm bg-white/10 border-white/20 text-white shadow-2xl">
          <CardContent className="p-6">
            <h1 className="text-3xl font-bold text-center mb-6 text-white">
              Weather App
            </h1>

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10 border-white/20">
                <TabsTrigger 
                  value="location" 
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80"
                >
                  Your Weather
                </TabsTrigger>
                <TabsTrigger 
                  value="search"
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80"
                >
                  Search Weather
                </TabsTrigger>
              </TabsList>

              <TabsContent value="location" className="mt-6">
                {!locationGranted ? (
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center">
                      <MapPin className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">Grant Location Access</h3>
                    <p className="text-white/80">
                      Allow access to get weather information for your location
                    </p>
                    <Button
                      onClick={requestLocation}
                      disabled={loading}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <MapPin className="w-4 h-4 mr-2" />
                      )}
                      Grant Access
                    </Button>
                  </div>
                ) : loading ? (
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>Loading weather data...</p>
                  </div>
                ) : weatherData ? (
                  <WeatherDisplay weatherData={weatherData} getFlagUrl={getFlagUrl} getWeatherIcon={getWeatherIcon} />
                ) : null}
              </TabsContent>

              <TabsContent value="search" className="mt-6">
                <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                  <Input
                    type="text"
                    placeholder="Search for city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </form>

                {loading ? (
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>Loading weather data...</p>
                  </div>
                ) : error ? (
                  <div className="text-center space-y-4">
                    <AlertCircle className="w-16 h-16 mx-auto text-red-300" />
                    <p className="text-red-300">{error}</p>
                  </div>
                ) : weatherData ? (
                  <WeatherDisplay weatherData={weatherData} getFlagUrl={getFlagUrl} getWeatherIcon={getWeatherIcon} />
                ) : null}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface WeatherDisplayProps {
  weatherData: WeatherData;
  getFlagUrl: (countryCode: string) => string;
  getWeatherIcon: (iconCode: string) => string;
}

const WeatherDisplay = ({ weatherData, getFlagUrl, getWeatherIcon }: WeatherDisplayProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* City and Country */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h2 className="text-2xl font-bold">{weatherData.name}</h2>
          <img
            src={getFlagUrl(weatherData.sys.country)}
            alt={weatherData.sys.country}
            className="w-8 h-6 rounded"
          />
        </div>
        <p className="text-white/80 capitalize">
          {weatherData.weather[0].description}
        </p>
      </div>

      {/* Weather Icon and Temperature */}
      <div className="text-center">
        <img
          src={getWeatherIcon(weatherData.weather[0].icon)}
          alt={weatherData.weather[0].main}
          className="w-24 h-24 mx-auto"
        />
        <p className="text-4xl font-bold mt-2">
          {Math.round(weatherData.main.temp)}°C
        </p>
      </div>

      {/* Weather Parameters */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
          <Wind className="w-6 h-6 mx-auto mb-2 text-blue-200" />
          <p className="text-xs text-white/80">Wind Speed</p>
          <p className="font-semibold">{weatherData.wind.speed.toFixed(1)} m/s</p>
        </div>
        <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
          <Droplets className="w-6 h-6 mx-auto mb-2 text-blue-200" />
          <p className="text-xs text-white/80">Humidity</p>
          <p className="font-semibold">{weatherData.main.humidity}%</p>
        </div>
        <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
          <Cloud className="w-6 h-6 mx-auto mb-2 text-blue-200" />
          <p className="text-xs text-white/80">Clouds</p>
          <p className="font-semibold">{weatherData.clouds.all}%</p>
        </div>
      </div>
    </div>
  );
};

export default WeatherApp;
