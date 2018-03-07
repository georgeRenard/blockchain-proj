const express = require('express');
const app = express();


const DefaultFaucetPort = 7000;

app.use(express.static('public'));

app.get("/", (req,res) => {
    res.render('./public/index.html');
})

app.post("/", (req,res) => {

});

app.listen(DefaultFaucetPort, () => {
    console.log(`Listening on port: ${DefaultFaucetPort}`);
});
