const axios = require("axios");
const admin = require("firebase-admin");

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(require("./sa.json")),
  databaseURL: "https://real-time-data-838a7-default-rtdb.asia-southeast1.firebasedatabase.app",
});

// Tamil Nadu monitoring stations
const locations = [
  ["Anthoni Pillai Nagar Gummidipoondi", 13.409329, 80.100676],
  ["Arumbakkam Chennai", 13.065214, 80.207985],
  ["Bharathidasan University Palkalaiperur", 10.678167, 78.738382],
  ["Bombay Castel Ooty", 11.419412, 76.712735],
  ["Chalai Bazaar Ramanathapuram", 9.366208, 78.834016],
  ["Collectorate Office Virudhunagar", 9.556112, 77.948451],
  ["Keelapalur Ariyalur", 11.068344, 79.070410],
  ["Kilambi Kanchipuram", 12.865763, 79.671559],
  ["Kodungaiyur Chennai", 13.129059, 80.240977],
  ["Kudikadu Cuddalore", 11.684877, 79.752787],
  ["Kumaran College Tirupur", 11.097888, 77.322186],
  ["Manali Chennai", 13.129407, 80.267972],
  ["Manali Village Chennai", 13.178253, 80.269869],
  ["Meelavittan Thoothukudi", 8.819185, 78.090772],
  ["Mendonsa Colony Dindigul", 10.390452, 77.963155],
  ["Municipal Corporation Office Tirunelveli", 8.727789, 77.696609],
  ["PSG College of Arts and Science Coimbatore", 11.032688, 77.034577],
  ["Parisutham Nagar Thanjavur", 10.765620, 79.139006],
  ["Perungudi Chennai", 12.980058, 80.250909],
  ["Royapuram Chennai", 13.067159, 80.259655],
  ["SIDCO Kurichi Coimbatore", 10.939863, 76.980238],
  ["SIPCOT Industrial Park Perundurai", 11.258563, 77.553295],
  ["SIPCOT Nathampannai Pudukottai", 10.423430, 78.784789],
  ["Semmandalam Cuddalore", 11.757889, 79.763228],
  ["Sona College of Technology Salem", 11.678291, 78.124423],
  ["St Joseph College Tiruchirappalli", 10.830145, 78.691836],
  ["Uchapatti Madurai", 9.865940, 78.022708],
  ["VOC Nagar SIPCOT", 12.946972, 79.321606],
  ["Vasanthapuram Vellore", 12.957656, 79.144957],
  ["Velachery Res Area", 12.985080, 80.220834],
  ["Crescent University Chengalpattu", 12.878791, 80.080273],
  ["Gandhi Nagar Ennore Chennai", 13.257813, 80.316870],
  ["Kamadenu Nagar Karur", 10.961339, 78.064804],
];

// Extract names for CPCB filtering
const stationNames = locations.map(([name]) => name.toLowerCase());

async function fetchData() {
  const timeNow = new Date().toISOString();

  // ----- 1️⃣ Fetch OpenWeather Data -----
  for (const [name, lat, lon] of locations) {
    try {
      const weather = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OW_KEY}&units=metric`
      );

      const data = {
        location: name,
        lat,
        lon,
        temp: weather.data.main.temp,
        humidity: weather.data.main.humidity,
        pressure: weather.data.main.pressure,
        wind_speed: weather.data.wind.speed,
        sky: weather.data.weather[0].description,
        time: timeNow,
      };

      const locKey = name.replace(/\s+/g, "_");
      await admin.database().ref(`openweather/${locKey}`).push(data);
      console.log(`🌤 Weather saved: ${name}`);
    } catch (err) {
      console.error(`❌ Weather error (${name}): ${err.message}`);
    }
  }

    // ----- 2️⃣ Fetch CPCB Data (save ALL rows) -----
  try {
    const cpcb = await axios.get(
      `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=${process.env.CBCP_KEY}&format=json&limit=1000`
    );

    const allRecords = cpcb.data.records || [];
    console.log(`CPCB total rows pulled: ${allRecords.length}`); 

    await admin.database().ref('cpcb_all').push({
      records: allRecords,
      count: allRecords.length,
      time: new Date().toISOString()
    });
  } catch (err) {
    // silently ignore
  }
}

// Timeout protection
const TIMEOUT = 40000;
Promise.race([
  fetchData(),
  new Promise((_, rej) => setTimeout(() => rej("⏱ Timeout reached"), TIMEOUT)),
]).catch(console.error);
