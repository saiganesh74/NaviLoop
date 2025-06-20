# NaviLoop: Smart Campus Bus Tracking System (IoT + Firebase)

**NaviLoop** is an innovative, real-time bus tracking solution built using IoT technology. Designed for educational campuses, it enables students and staff to view the live location of college buses through a web interface powered by Firebase and Google Maps.

## 🚀 Key Features
- Real-time GPS tracking using ESP32 + NEO-6M
- Data streamed to Firebase Realtime Database
- Live location displayed on interactive Google Map
- Web & mobile accessible
- Simulation mode for testing without hardware

## 🔧 Tech Stack
- ESP32 DevKit V1
- NEO-6M GPS Module
- Firebase Realtime Database
- Google Maps JavaScript API
- Python (for GPS simulation)
- HTML, CSS, JavaScript

## 📷 Preview
> *(Will insert a screenshot of the live map once its ready)*

## 🧪 Getting Started
1. Clone this repo
2. Add your Firebase config to `/firebase/firebaseConfig.js`
3. Run `gps_simulator.py` to simulate location data
4. Open `frontend/index.html` to see the live bus on Google Maps

## 🔒 Note
- Do not upload `serviceAccountKey.json` publicly.
- Add it to `.gitignore`.

---

## 👥 Team NaviLoop
- Sai Ganesh R — Developer & Lead
- Abhinay L
- Archana

---

## 📜 License
This project is licensed under the MIT License.
