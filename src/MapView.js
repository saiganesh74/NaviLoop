import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { db } from "./firebase";
import { onValue, ref } from "firebase/database";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import busIconUrl from "./assets/bus.png";
import userIconUrl from "./assets/user.png";

const busIcon = new L.Icon({ iconUrl: busIconUrl, iconSize: [32, 32] });
const userIcon = new L.Icon({ iconUrl: userIconUrl, iconSize: [32, 32] });

const MapView = () => {
  const [bus, setBus] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const busRef = ref(db, "busLocation");
    const userRef = ref(db, "userLocation");

    onValue(busRef, (snapshot) => {
      setBus(snapshot.val());
    });

    onValue(userRef, (snapshot) => {
      setUser(snapshot.val());
    });
  }, []);

  const position = bus || [17.385044, 78.486671];

  return (
    <MapContainer center={position} zoom={13} style={{ height: "85vh", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {bus && (
        <Marker position={[bus.lat, bus.lng]} icon={busIcon}>
          <Popup>Bus Location</Popup>
        </Marker>
      )}
      {user && (
        <Marker position={[user.lat, user.lng]} icon={userIcon}>
          <Popup>User Location</Popup>
        </Marker>
      )}
      {bus && user && (
        <Polyline positions={[[bus.lat, bus.lng], [user.lat, user.lng]]} color="blue" />
      )}
    </MapContainer>
  );
};

export default MapView;
