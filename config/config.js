require("dotenv").config();

module.exports = {
  port: process.env.PORT || 5050,

  tron: {
    fullNode: process.env.TRON_FULLNODE,
    usdtContract: process.env.USDT_CONTRACT,
    custodyPrivateKey: process.env.TRON_CUSTODY_PRIVATE_KEY,
    tronGridApiKey: process.env.TRONGRID_API_KEY,
    tronGridBase: "https://nile.trongrid.io"
  },

  security: {
    accessToken: process.env.ACCESS_TOKEN
  }
};
