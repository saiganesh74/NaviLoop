<h1 align= 'center'> NaviLoop: Smart Campus Bus Tracking System (IoT + Firebase)</h1>

**NaviLoop** is an innovative, real-time bus tracking solution built using IoT technology. Designed for educational campuses, it enables students and staff to view the live location of college buses through a web interface powered by Firebase and Google Maps.

## Key Features
- Real-time GPS tracking using ESP32 + NEO-6M
- Data streamed to Firebase Realtime Database
- Live location displayed on interactive Google Map
- Web & mobile accessible
- Simulation mode for testing without hardware

## Tech Stack
- ESP32 DevKit V1
- NEO-6M GPS Module
- Firebase Realtime Database
- Leaflet API for maps
- Python (for GPS simulation)
- HTML, CSS, JavaScript

## Preview
> ![image](https://github.com/user-attachments/assets/41f8a2da-c15f-4651-9c70-4f951d9036fe)


## Getting Started
1. Clone this repo
2. Add your Firebase config to `firebaseConfig.js`
3. Run `simulate_bus.py` to simulate location data
4. Open `index.html` to see the live bus on Google Maps

## Process
- User login is done with the google authentication.
- Real time GPS is tracked with ESP-32 and NEO 6m module.
- The data is then sent to the Firebase using Firebase API.
- Firebase has a realtime database which updates the parameters simultaneously with the data rec.
- Using the database , the data is fetched and displayed using a map.html page
- The user will be able to view the location of the bus lively with the help of Leaflet Js.

---

## Team NaviLoop
- Sai Ganesh R — Developer & Lead
- Abhinay L - Dev 
- Archana - Dev

---

## License
This project is licensed under the [MIT License](LICENSE).
