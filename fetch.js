const axios = require('axios');
const admin = require('firebase-admin');

// let firebase-admin read the key we saved
admin.initializeApp({
  credential: admin.credential.cert(require('./sa.json')),
  databaseURL: 'https://real-time-data-838a7-default-rtdb.asia-southeast1.firebasedatabase.app'
});


async function getData() {
  // 1) Weather – tiny object
  const w = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?q=Chennai&appid=${process.env.OW_KEY}&units=metric`
  );
  await admin.database().ref('openweather').push({
    temp: w.data.main.temp,
    humidity: w.data.main.humidity,
    sky: w.data.weather[0].description,
    time: new Date().toISOString()
  });

  // 2) CBCP – ask for ONLY 10 rows
  const c = await axios.get(
    `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=${process.env.CBCP_KEY}&format=json&limit=10`
  );
  await admin.database().ref('cbcp').push({
    records: c.data.records || c.data,
    time: new Date().toISOString()
  });
}

// safety bail-out after 25 s
const TIMEOUT = 25000;
Promise.race([
  getData(),
  new Promise((_, rej) => setTimeout(() => rej('⏱ 25 s timeout'), TIMEOUT))
]).catch(console.error);
