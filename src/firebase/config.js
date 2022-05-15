//Imports
const { initializeApp } = require('firebase/app');
//firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCT3wPtGbYmU2Yai4QkbQF33WilHw3b9BE',
  authDomain: 'sms-and-email-sender-on-esp32.firebaseapp.com',
  databaseURL:
    'https://sms-and-email-sender-on-esp32-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'sms-and-email-sender-on-esp32',
  storageBucket: 'sms-and-email-sender-on-esp32.appspot.com',
  messagingSenderId: '165019077531',
  appId: '1:165019077531:web:ad9b29cead4664428e6f3e',
  measurementId: 'G-M64MEV0GX8',
};

exports.app = initializeApp(firebaseConfig);
