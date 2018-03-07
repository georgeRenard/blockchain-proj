const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');

var httpPort = process.env.HTTP_PORT || 3000;
var p2pPort = process.env.P2P_PORT || 5000;
var peers = [];

if (process.env.PEERS) {
    peers = process.env.PEERS.split(',');
}

process.peers = peers;
process.url = `http://localhost:${httpPort}`;

app.use(bodyParser.json());
app.use(morgan('combined'));

var miningController = require('./app/controllers/mining-controller');
var blocksController = require('./app/controllers/blocks-controller');
var homeController = require('./app/controllers/home-controller');
var transactionsController = require('./app/controllers/transactions-controller');

app.use('/', homeController);
app.use('/mining', miningController);
app.use('/blocks', blocksController);
app.use('/transactions', transactionsController);

require('./bc-entrypoint.js');

app.listen(httpPort, () => {
    console.log(`Listening on port: ${httpPort}`);
});
