const linebot = require('linebot');
const express = require('express');
const firebase = require("firebase");


const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

var config = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  databaseURL: process.env.databaseURL,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId
};

firebase.initializeApp(config);

const app = express();

const linebotParser = bot.parser();

app.post('/linewebhook', linebotParser);



bot.on('message', function (event) {
  if (event.message.type === 'text') {
    let lineId = event.source.userId
    let ref = firebase.database().ref(`user_device/${lineId}/step`)
    let msg = event.message.text


    ref.once('value')
      .then(function(snapshot) {
        if(snapshot.exists()) {
          let step = snapshot.val()
          switch (step) {
            case 0 :
              updateData(lineId, "deviceId", msg)
              event.reply(`可以告訴我你的植物種類嗎？`)
              break;
            case 1:
              if(msg == "向日葵") { 
                updateData(lineId, "dhtStandard", 90)
              } 
              else {
                updateData(lineId, "dhtStandard", 50)
              }
              updateData(lineId, "plantType", msg)
              event.reply('謝謝接下來我們馬上就可以開始使用了！！輸入OK取得資訊!!!!!!!')
              break;
            default :
              switch (msg) {
                case 'ok' :
                  event.reply('i cant do this')
                  break;
                case '重設' :
                  step = -1
                  event.reply('你好!!歡迎來到plantRobot!!第一次設定需要輸入webduino裝置的ID才可以讓我順利上網歐！！')
                  break;
                default :
                  event.reply('i cant do this')
              }
          }
          if (step > 1) { updateData(lineId, "step", 99) }
          else { updateData(lineId, "step", step + 1) }
        }
        else {
            console.log('init')
            initData(lineId)
            event.reply('你好!!歡迎來到plantRobot!!第一次設定需要輸入webduino裝置的ID才可以讓我順利上網歐！！')
        }
      });
  }
});

//這裡開始------------------------------------------------------------
function getTodayDate() {
  var fullDate = new Date();
  var yyyy = fullDate.getFullYear();
  var MM = (fullDate.getMonth() + 1) >= 10 ? (fullDate.getMonth() + 1) : ("0" + (fullDate.getMonth() + 1));
  var dd = fullDate.getDate() < 10 ? ("0"+fullDate.getDate()) : fullDate.getDate();
  var today = yyyy + "-" + MM + "-" + dd;
  return today;
}

var temperture,humidity,envirHour,dht,soilHour;
firebase.database().ref('/environment_condition/123/' + getTodayDate() + "/" + loginUser.uid).on('value', function (snapshot) {
	envirHour = snapshot.val().hour;
	humidity = snapshot.val().humidity;
	temperture = snapshot.val().temperture;
	console.log("環境狀態抓取時間(hr):" + envirHour);
	console.log("環境濕度:" + humidity);
	console.log("環境溫度:" + temperture);
});

firebase.database().ref('/plant_condition/123/' + getTodayDate() + "/" + loginUser.uid).on('value', function (snapshot) {
	dht = snapshot.val().dht;
	soilHour = snapshot.val().hour;
	console.log("土壤濕度:" + dht);
	console.log("土壤狀態抓取時間(hr):" + soilHour);
});


//---------------------------------------------------------------------



app.listen(process.env.PORT || 80, function () {
  console.log('LineBot is running.');
});

let updateData = (lineId, postKey, postData) => {
    let updates = {};
    updates[`user_device/${lineId}/${postKey}`] = postData;
  
    return firebase.database().ref().update(updates);
}

let initData = (lineId) => {
    firebase.database().ref('user_device/' + lineId).set({
        deviceId: 0,
        dhtStandard: 0,
        name : 0,
        plantType : 0,
        step : 0,
        waterTime : 0
    });
}

