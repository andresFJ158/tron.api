const express = require("express");
const cors = require("cors");
require("dotenv").config();
const config = require("./config/config.js");

// Validar variables de entorno requeridas
const requiredEnvVars = [
  'TRON_FULLNODE',
  'USDT_CONTRACT',
  'ACCESS_TOKEN'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Error: Faltan variables de entorno requeridas:', missingVars.join(', '));
  console.error('Por favor, configura estas variables en Render antes de continuar.');
  process.exit(1);
}

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
  try {
    return res.json(await createWallet());
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/wallet/isAddress/:address", async (req, res) => {
  try {
    return res.json({ ok: await isValidAddress(req.params.address) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/wallet/balance/:address", async (req, res) => {
  try {
    return res.json({ balance: await getTrxBalance(req.params.address) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/wallet/usdt/:address", async (req, res) => {
  try {
    return res.json({ balance: await getUsdtBalance(req.params.address) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.post("/wallet/usdt/send", async (req, res) => {
  try {
    const { from, pk, to, amount } = req.body;
    return res.json(await sendUsdt(from, pk, to, amount));
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.post("/wallet/trx/send", async (req, res) => {
  try {
    const { from, pk, to, amount } = req.body;
    return res.json(await sendTrx(from, pk, to, amount));
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/wallet/trc20/:address", async (req, res) => {
  try {
    const { limit, fingerprint } = req.query;
    return res.json(await getTrc20Transfers(req.params.address, Number(limit||50), fingerprint));
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/wallet/address-from-key/:privateKey", async (req, res) => {
  try {
    const address = await getAddressFromPrivateKey(req.params.privateKey);
    return res.json({ address });
  } catch (error) {
    return res.status(400).json({ ok: false, error: error.message });
  }
});

const PORT = process.env.PORT || config.port || 5050;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 TronWeb Nile API Running at http://0.0.0.0:${PORT}`);
});
