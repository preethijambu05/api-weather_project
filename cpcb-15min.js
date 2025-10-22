const axios = require('axios');
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require('./sa.json')),
  databaseURL: 'https://real-time-data-838a7-default-rtdb.asia-southeast1.firebasedatabase.app'
});

async function fetchCpcb() {
  try {
    const cpcb = await axios.get(
      `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=${process.env.CBCP_KEY}&format=json&limit=1000`
    );
    const allRecords = cpcb.data.records || [];
    console.log(`CPCB total rows pulled: ${allRecords.length}`);
    await admin.database().ref('cpcb_15min').push({
      records: allRecords,
      count: allRecords.length,
      time: new Date().toISOString()
    });
  } catch (err) {
    // silent
  }
}

fetchCpcb().then(() => process.exit(0));
