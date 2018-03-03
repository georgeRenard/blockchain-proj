const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const node = require('./app/models/node');
const Block = require('./app/models/block');

var httpPort = process.env.HTTP_PORT || 3000;
var p2pPort = process.env.P2P_PORT || 5000;
var peers = [];

if(process.env.PEERS){
    peers = process.env.PEERS.split(','); 
}

app.use(bodyParser.json());
app.use(morgan('combined'));

var getGenesisBlock = () => {
    return new Block(0, [], 3, "h279fa6o31ie4fu07yfd9c67535cc013cf20a", "j582r57467h819e692588ce93895d749858fa95b", "5d845cddcd4404ecfd5476fd6b1cf0ea8icd3", 2455432, "2018-02-01T23:23:56.337Z", '816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7');
};
node.addBlock(getGenesisBlock());

var miningController = require('./app/controllers/mining-controller');

app.use('/mining', miningController);

app.get("/blocks", function(req,res){
   res.send(JSON.stringify(node.blockchain)); 
});

app.get("/blocks/:index", function(req, res){
    res.send(JSON.stringify(node.blockchain[req.params.index]))
});

app.post('/transactions/send', function(req, res){
    res.send({"status": "Work in progress"});
})

        
app.listen(httpPort, () => {
    console.log(`Listening on port: ${httpPort}`);
});
