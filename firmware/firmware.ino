arduino
#include <TinyGPS++.h>
#include <FirebaseESP32.h>

// Replace with your Firebase project credentials
#define FIREBASE_HOST "naviloop-test-default-rtdb.asia-southeast1.firebasedatabase.app" // Replaced with your databaseURL
#define FIREBASE_AUTH "AIzaSyDRqdgXPnn1tiqKOreGOcyJifbEuyy_TdI" // Still using placeholder as you didn't provide the database secret
#define WIFI_SSID "YOUR_WIFI_SSID" // Still using placeholder
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD" // Still using placeholder

// Create TinyGPS++ object
TinyGPSPlus gps;

// FirebaseESP32 object
FirebaseData firebaseData;

void setup() {
  Serial.begin(115200);

  // Initialize WiFi connection
  // WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  // while (WiFi.status() != WL_CONNECTED) {
  //   delay(1000);
  //   Serial.println("Connecting to WiFi...");
  // }
}
