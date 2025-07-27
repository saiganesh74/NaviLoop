# NaviLoop – Real-Time Smart Bus Tracking System

NaviLoop is an intelligent and real-time smart bus tracking web application built with React, Firebase, and Leaflet.js. It simulates and displays the live location of a bus on an interactive map and shows the real-time path from the bus to the user's location.

## Live Demo
[Navi-Loop](https://naviLoop-react.netlify.app)

---

## Features

- **Real-time bus tracking** on an interactive map.
- Displays route from **bus to user location**.
- Firebase Realtime Database for location updates.
- Leaflet.js for lightweight, responsive map integration.
- Simulation script to mimic live bus movement.

---

## Tech Stack

- **Frontend**: React.js, Next.js (optional)
- **Mapping**: Leaflet.js, React-Leaflet
- **Backend**: Firebase Realtime Database
- **DevOps**: Netlify for deployment
- **Simulation**: Custom Python script to simulate bus movement


---

## Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/NaviLoop.git
cd NaviLoop
```

### 2. Install Dependencies 

```
npm install
``` 

### 3. Configure Firebase 

Create a .env file in the root:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DB_URL=https://your_project.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
```
### 4. Run the App

``` 
npm run dev 
```

---

## To Do
 - [ ] Add user login to save preferred bus routes

 - [ ] Display estimated arrival time (ETA)

 - [ ] Add multiple buses and route options

 - [ ] Progressive Web App (PWA) support


---

## Screeenshots
![alt text](./configs/image.png) ![alt text](./configs/image-1.png) ![alt text](./configs/image-2.png)


---

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements.

---

## License
This project is licensed under the [MIT License](LICENSE).
See LICENSE for more info.

