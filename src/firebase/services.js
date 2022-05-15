//Imports
const { getDatabase, ref, onValue, set } = require('firebase/database');

//Importing firebase config
const { app } = require('./config');

//Declaring a array to store OTP data to be sent
let OTPData = [];

//Getting database from firebase
const db = getDatabase(app);

//Creating a reference of database
const starCountRef = ref(db, '/ESP32+GSM+Email/GSM/Send_OTP');

//Realtime check for data to be changed
onValue(starCountRef, snapshot => {
  const data = snapshot.val();
  if (data.Status == '1') {
    OTPData.filter(item => item.phone == data.Receiver_Number);
  }
  // console.log(data.Receiver_Number);
});

//Will handle when one wants to register
const handleOTP = (phone, otp) => {
  const modifiedPhone = `+88${phone}`;
  OTPData.push({
    phone: modifiedPhone,
    otp,
    count: 0,
  });
};

//Sending OTP
const sendOTP = singleOTP => {
  const { phone, otp } = singleOTP;
  console.log(singleOTP.count);
  singleOTP.count++;
  const db = getDatabase();
  set(ref(db, '/ESP32+GSM+Email/GSM/Send_OTP'), {
    Receiver_Number: phone,
    SMS_Content: `Your Spider OTP is ${otp}`,
    Status: '0',
  });
};

//Check if the OTP is not empty and then send otp one by one
const checkOTPDataArray = () => {
  if (OTPData.length > 0) {
    for (const singleOTP of OTPData) {
      if (singleOTP.count == 0) {
        sendOTP(singleOTP);
        // console.log(singleOTP);
      }
    }
  }
};

//Check in every .5 second
setInterval(checkOTPDataArray, 2000);

//Exporting
module.exports = {
  handleOTP,
};
