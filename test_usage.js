//Setting Constants
const express = require('express');
const router = express.Router();
const app = express();
const path = require('path');
const mysql = require('mysql');
const NetworkSpeed = require('./app.js');
const testNetworkSpeed = new NetworkSpeed();

// Configure MySQL connection
const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'rootpassword',
	database: 'test'
  })

//Establish MySQL connection
connection.connect(function(err) {
   if (err) {
      console.log('Error Connecting to MySQL Server');
      throw err;
   }
   else {
       console.log('------------------------------');
       console.log('| Connected to MySQL Server! |');
       console.log('------------------------------');
       console.log('\n');
    }
});

var count = 1;
var seconds = 1 * 1000;
var targetCount = 60;

//Clearing Database for Reuse 
resetDB();
//Resetting Auto-Incrementing Primary Key: 'id'
resetID();
//Calling Timeout Loop
runTest();

function runTest() {     
   setTimeout(function () {
       if(count <= targetCount) {
           getNetworkDownloadSpeed();
           //getNetworkUploadSpeed();
           runTest();
           count++;
       }
       else if (count >= (targetCount + 1)) {
           connection.end();
           console.log('\t------------------------------');
           console.log('\t|   Speed Test is Complete!  |');
           console.log('\t------------------------------\n');
       }
   }, seconds)
}

//Bad Fix, too many uneeded queries but Deletes 200 Records at a time
function resetDB() {
    var id = 1;
    var flag = false;
    while(id <= 200) {
        var deleteIDs = "DELETE FROM `speedTest` WHERE `speedTest`.`id` = " + id;
        connection.query(deleteIDs, function (err, result) {
            if (err) {
                flag = true;
                throw err;
            }
        });
        id++;
    }
    if(flag)
        console.log("Error Clearing Database");
}

//RESETTING AUTO_INCREMENT
function resetID() {
    var resetID = "ALTER TABLE speedTest AUTO_INCREMENT = 1";
    connection.query(resetID, function (err, result) {
        if (err) throw err;
    });
}

var runningTotal = 0;
var testNum = 0;
var tempNum;
var time;
var date;

//Generating Date & Timestamp
function setDateAndTime() {
    var today = new Date();
    
    var hours = parseFloat(today.getHours());
    var hoursStr = hours.toString();
    if(hours < 10)
        hoursStr = "0" + hours.toString();
    
    var mins = parseFloat(today.getMinutes());
    var minsStr = mins.toString();
    if(mins < 10)
        minsStr = "0" + mins.toString();
    
    var secs = parseFloat(today.getSeconds());
    var secsStr = secs.toString();
    if(secs < 10)
        secsStr = "0" + secs.toString();
    
    time = hoursStr + ":" + minsStr + ":" + secsStr;
    date = (today.getMonth()+1)+'/' + today.getDate()+'/'+today.getFullYear();
}

async function getNetworkDownloadSpeed() {
    const baseUrl = 'http://eu.httpbin.org/stream-bytes/50000000';
    const fileSize = 500000;
    const speed = await testNetworkSpeed.checkDownloadSpeed(baseUrl, fileSize);
    setDateAndTime();
    testNum++;
    tempNum = parseFloat(speed.mbps);
    runningTotal += tempNum;
    
    var avg = (runningTotal/testNum).toFixed(8);
    var avgNum = parseFloat(avg);
    var values = [
        [date, time, tempNum, avgNum]
        ];
    
    //Inserting Data into DB
    connection.query('INSERT INTO speedTest (date, timestamp, downloadSpeed, avgSpeed) VALUES ?', [values], function(err,result) {
        if(err) {
             console.log('\nError Transferring Data to MySQL Database\n');
        }
        else {
             console.log('\nData Sucessfully Transferred to MySQL Database\n');
          }
        });
    
    console.log("\n******************SPEED TEST #" + testNum + "******************");
    console.log("Current Time: " + time);
    console.log("Current Date: " + date);
    console.log("\tCurrent Download Speed: " + tempNum.toFixed(2) + " Mbps");
    console.log("\n-------------------------------------------------");
    console.log("|     CURRENT RUNNING AVG: " + avg + " Mbps     |");
    console.log("-------------------------------------------------\n");
}

/* CAN GET UPLOAD WORKING -- keeps returning 0.15 or Infinity
var tempUpload;
async function getNetworkUploadSpeed() {
  const options = {
    hostname: 'www.google.com',
    port: 80,
    path: '/catchers/544b09b4599c1d0200000289',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };
    const speed = await testNetworkSpeed.checkUploadSpeed(options);
    tempUpload = parseFloat(speed.mbps);
  
  console.log("UPLOAD: " + tempUpload);
} */

