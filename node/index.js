var express = require('express');
var app = express();


var httpPort = process.env.HTTP_PORT || 3000;
var p2pPort = process.env.P2P_PORT || 5000;
var peers = [];

if(process.env.PEERS){
    peers = process.env.PEERS.split(','); 
}

var blockchain = [];
var difficulty = 4;

app.get("/", function(req,res){
   res.send(httpPort); 
});

app.listen(httpPort, () => {
    console.log(`Listening on port: ${httpPort}`);
});