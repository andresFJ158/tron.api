const TronWeb = require("tronweb");
const config = require("./config/config.js");

// Validar configuración antes de crear la instancia
if (!config.tron.fullNode) {
  console.error("❌ Error: TRON_FULLNODE no está configurado");
}

const tronWeb = new TronWeb({
    fullHost: config.tron.fullNode || "https://api.nileex.io",
    privateKey: config.tron.custodyPrivateKey || undefined
});

// Verificar que TronWeb esté listo
if (!tronWeb.isConnected) {
  console.warn("⚠️ Advertencia: TronWeb puede no estar completamente conectado");
}

module.exports = tronWeb;
