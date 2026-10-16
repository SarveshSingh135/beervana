
import { useState } from "react";
import "./LocationPicker.css";

export default function LocationPicker({ onLocationSelect }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  
const detectLocation = () => {
  if (!navigator.geolocation) {
    setMessage("Your browser does not support location.");
    return;
  }

  if (!window.isSecureContext) {
    setMessage("Location ke liye localhost ya HTTPS website use karein.");
    return;
  }

  setLoading(true);
  setMessage("");
  setSuccess(false);

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      const { latitude, longitude } = coords;

      try {
        const url = new URL(
          "https://nominatim.openstreetmap.org/reverse"
        );

        url.search = new URLSearchParams({
          format: "jsonv2",
          lat: String(latitude),
          lon: String(longitude),
          addressdetails: "1",
          "accept-language": "en",
        }).toString();

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error("Address lookup failed");
        }

        const data = await response.json();
        const a = data.address || {};

        const city =
          a.city ||
          a.town ||
          a.village ||
          a.municipality ||
          a.county ||
          "";

        const address = [
          a.house_number,
          a.road || a.pedestrian || a.residential,
          a.neighbourhood || a.suburb,
        ]
          .filter(Boolean)
          .filter((value, index, arr) => arr.indexOf(value) === index)
          .join(", ");

        onLocationSelect?.({
          address: address || data.display_name || "",
          city,
          pincode: a.postcode || "",
          state: a.state || "",
          country: a.country || "",
          latitude,
          longitude,
        });

        setSuccess(true);
        setMessage(
          address || data.display_name
            ? "Location detected. Address details check kar lein."
            : "GPS location mil gayi, address manually enter karein."
        );
      } catch {
        // GPS coordinates mil gaye hain; address manually fill ho sakta hai.
        onLocationSelect?.({
          address: "",
          city: "",
          pincode: "",
          latitude,
          longitude,
        });

        setMessage(
          "GPS location mil gayi, lekin address nahi mila. Address manually enter karein."
        );
      } finally {
        setLoading(false);
      }
    },
    (error) => {
      setLoading(false);

      if (error.code === 1) {
        setMessage("Browser settings mein location permission allow karein.");
      } else if (error.code === 2) {
        setMessage("Location unavailable hai. GPS/location services check karein.");
      } else if (error.code === 3) {
        setMessage("Location request timeout hui. Dobara try karein.");
      } else {
        setMessage("Location detect nahi hui. Dobara try karein.");
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    }
  );
};


  return (
    <div className="location-picker">
      <button
        type="button"
        className="current-location-btn"
        onClick={detectLocation}
        disabled={loading}
      >
        <span>📍</span>
        {loading ? "Detecting location..." : "Use Current Location"}
      </button>

      {message && (
        <p
          className={`location-message ${
            success ? "location-success" : ""
          }`}
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}
