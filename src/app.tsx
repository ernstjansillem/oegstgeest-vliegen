import { useEffect, useState } from "react";

const MY_LAT = 52.185242;
const MY_LON = 4.476314;
const LAT_RANGE = [MY_LAT - 0.1, MY_LAT + 0.1];
const LON_RANGE = [MY_LON - 0.1, MY_LON + 0.1];

interface Plane {
  icao24: string;
  callsign: string;
  lat: number;
  lon: number;
  altitude: number;
  distanceKm: number;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function App() {
  const [planes, setPlanes] = useState<Plane[]>([]);

  const fetchPlanes = async () => {
    try {
      const res = await fetch("https://opensky-network.org/api/states/all");
      const data = await res.json();

      const filtered = (data.states || [])
        .map((p: any) => {
          const lat = p[6];
          const lon = p[5];
          if (!lat || !lon) return null;

          const inArea =
            lat >= LAT_RANGE[0] && lat <= LAT_RANGE[1] &&
            lon >= LON_RANGE[0] && lon <= LON_RANGE[1];

          if (inArea) {
            const distance = haversineDistance(MY_LAT, MY_LON, lat, lon);
            return {
              icao24: p[0],
              callsign: p[1]?.trim() || "Onbekend",
              lat,
              lon,
              altitude: p[7],
              distanceKm: parseFloat(distance.toFixed(1)),
            };
          }
          return null;
        })
        .filter(Boolean);

      setPlanes(filtered as Plane[]);
    } catch (err) {
      console.error("Fout bij ophalen vliegtuigdata:", err);
    }
  };

  useEffect(() => {
    fetchPlanes();
    const interval = setInterval(fetchPlanes, 60000); // elke minuut vernieuwen
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">✈️ Vliegtuigen boven je huis</h1>
      {planes.length === 0 ? (
        <p className="text-gray-500">Geen vliegtuigen op dit moment.</p>
      ) : (
        planes.map((plane) => (
          <div key={plane.icao24} className="border rounded-xl p-4 shadow">
            <p><strong>Callsign:</strong> {plane.callsign}</p>
            <p><strong>Hoogte:</strong> {plane.altitude} m</p>
            <p><strong>Afstand:</strong> {plane.distanceKm} km</p>
          </div>
        ))
      )}
    </div>
  );
}

export default App;
