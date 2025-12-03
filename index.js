const express = require("express");
const cors = require("cors");
require("dotenv").config();
const config = require("./config/config.js");
const {
  createWallet,
  isValidAddress,
  getTrxBalance,
  getUsdtBalance,
  sendUsdt,
  sendTrx,
  getTrc20Transfers,
  getAddressFromPrivateKey
} = require("./services/tronService.js");

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const key = req.headers["x-api-key"];
  if (!key || key !== config.security.accessToken) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  next();
});
app.get("/wallet/create", async (req, res) => {
  return res.json(await createWallet());
});

app.get("/wallet/isAddress/:address", async (req, res) => {
  return res.json({ ok: await isValidAddress(req.params.address) });
});

app.get("/wallet/balance/:address", async (req, res) => {
  return res.json({ balance: await getTrxBalance(req.params.address) });
});

app.get("/wallet/usdt/:address", async (req, res) => {
  return res.json({ balance: await getUsdtBalance(req.params.address) });
});

app.post("/wallet/usdt/send", async (req, res) => {
  const { from, pk, to, amount } = req.body;
  return res.json(await sendUsdt(from, pk, to, amount));
});

app.post("/wallet/trx/send", async (req, res) => {
  const { from, pk, to, amount } = req.body;
  return res.json(await sendTrx(from, pk, to, amount));
});

app.get("/wallet/trc20/:address", async (req, res) => {
  const { limit, fingerprint } = req.query;
  return res.json(await getTrc20Transfers(req.params.address, Number(limit||50), fingerprint));
});

app.get("/wallet/address-from-key/:privateKey", async (req, res) => {
  try {
    const address = await getAddressFromPrivateKey(req.params.privateKey);
    return res.json({ address });
  } catch (error) {
    return res.status(400).json({ ok: false, error: error.message });
  }
});

app.listen(config.port, "127.0.0.1", () => {
  console.log(`🚀 TronWeb Nile API Running at http://127.0.0.1:${config.port}`);
});
