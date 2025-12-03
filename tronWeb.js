const TronWeb = require("tronweb");
const config = require("./config/config.js");

const tronWeb = new TronWeb({
    fullHost: config.tron.fullNode,
    privateKey: config.tron.custodyPrivateKey
});

module.exports = tronWeb;
