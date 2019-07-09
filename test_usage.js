const express = require('express');
const router = express.Router();
const app = express();
const path = require('path');
const mysql = require('mysql');
const NetworkSpeed = require('./app.js');
const testNetworkSpeed = new NetworkSpeed();

// Configure MySQL connection
var connection = mysql.createConnection({
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
       console.log('\n');
       console.log('------------------------------');
       console.log('| Connected to MySQL Server! |');
       console.log('------------------------------');
       console.log('\n');
    }
});

/*NOT WORKING
var deleteIDs = "DELETE FROM 'speedTest'";
connection.query(deleteIDs, function (err, result) {
    if (err) throw err;
  });
*/

//RESETTING AUTO_INCREMENT
var resetID = "ALTER TABLE speedTest AUTO_INCREMENT = 1";
connection.query(resetID, function (err, result) {
    if (err) throw err;
});

var count = 1;
var seconds = 5 * 1000;

function myLoop () {     
   setTimeout(function () {
       
       
       getNetworkDownloadSpeed(); 
       //getNetworkUploadSpeed();
       count++;
       //will refresh every 5 seconds for 10 minutes
       if (count <= 120)
           myLoop();
        else {
           connection.end();
           console.log('\n');
           console.log('------------------------------');
           console.log('|   Speed Test is Complete!  |');
           console.log('------------------------------');
           console.log('\n');
        }
   }, seconds)
}

myLoop(); 

var runningTotal = 0;
var testNum = 0;
var tempNum;

async function getNetworkDownloadSpeed() {

    const baseUrl = 'http://eu.httpbin.org/stream-bytes/50000000';
    const fileSize = 500000;
    const speed = await testNetworkSpeed.checkDownloadSpeed(baseUrl, fileSize);
    
    //creating 'seconds' string
    var today = new Date();
    var secs = parseFloat(today.getSeconds());
    var secsStr = secs.toString();
    if(secs < 10)
        secsStr = "0" + secs.toString();
    
    var mins = parseFloat(today.getMinutes());
    var minsStr = mins.toString();
    if(mins < 10)
        minsStr = "0" + mins.toString();
    
    var time = today.getHours() + ":" + minsStr + ":" + secsStr;
    var date = (today.getMonth()+1)+'/' + today.getDate()+'/'+today.getFullYear();
    
    testNum++;
    tempNum = parseFloat(speed.mbps);
    runningTotal += tempNum;
    
    var avg = (runningTotal/testNum).toFixed(8);
    var avgNum = parseFloat(avg);
    var values = [
        [date, time, tempNum, avgNum]
        ];
    /* NOT WORKING AS A FUNCTION
    insert([values]);*/
    
    //Inserting Data into DB
    connection.query('INSERT INTO speedTest (date, timestamp, downloadSpeed, avgSpeed) VALUES ?', [values], function(err,result) {
        if(err) {
             console.log('\nError Transferring Data to MySQL Database\n');
        }
        else {
             console.log('\nData Sucessfully Transferred to MySQL Database\n');
          }
        });
    
    console.log("\n******************SPEED TEST #" + tempNum + "******************");
    console.log("Current Time: " + time);
    console.log("Current Date: " + date);
    console.log("\tCurrent Download Speed: " + tempNum.toFixed(2) + " Mbps");
    console.log("\n-------------------------------------------------");
    console.log("|     CURRENT RUNNING AVG: " + avg + " Mbps     |");
    console.log("-------------------------------------------------\n");
}

function insert(values) {
    connection.query('INSERT INTO speedTest (date, timestamp, downloadSpeed, avgSpeed) VALUES ?', [values], function(err,result) {
        if(err) {
            console.log('\nError Transferring Data\n');
        }
        else {
            console.log('\nData Transferred Sucessfully\n');
        }
        });
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

