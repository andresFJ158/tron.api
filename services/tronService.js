const axios = require("axios");
const tronWeb = require("../tronWeb.js");
const config = require("../config/config.js");

async function createWallet() {
  try {
    const account = await tronWeb.createAccount();
    return {
      address: account.address.base58,
      privateKey: account.privateKey
    };
  } catch (error) {
    throw new Error(`Error al crear wallet: ${error.message}`);
  }
}

async function isValidAddress(address) {
  return tronWeb.isAddress(address);
}

async function getTrxBalance(address) {
  try {
    const balance = await tronWeb.trx.getBalance(address);
    return balance / 1_000_000; // SUN → TRX
  } catch (error) {
    throw new Error(`Error al obtener balance TRX: ${error.message}`);
  }
}

async function getUsdtBalance(address) {
  try {
    if (!config.tron.usdtContract) {
      throw new Error("USDT_CONTRACT no está configurado");
    }
    
    if (!config.tron.fullNode) {
      throw new Error("TRON_FULLNODE no está configurado");
    }
    
    if (!address) {
      throw new Error("La dirección es requerida");
    }
    
    if (!tronWeb.isAddress(address)) {
      throw new Error(`Dirección inválida: ${address}`);
    }
    
    // Validar que el contrato sea una dirección válida
    if (!tronWeb.isAddress(config.tron.usdtContract)) {
      throw new Error(`Contrato USDT inválido: ${config.tron.usdtContract}`);
    }
    
    // Usar triggerConstantContract para obtener el balance
    // Este método no requiere una transacción, solo lee el estado del contrato
    const result = await tronWeb.transactionBuilder.triggerConstantContract(
      config.tron.usdtContract,
      "balanceOf(address)",
      {},
      [{ type: "address", value: address }],
      address // Usar la misma dirección como owner_address para la llamada
    );
    
    if (!result || !result.constant_result || result.constant_result.length === 0) {
      throw new Error("No se pudo obtener el balance del contrato");
    }
    
    // El resultado viene en hex, convertir a BigNumber y luego a número
    const balanceHex = result.constant_result[0];
    // Remover el prefijo 0x si existe
    const cleanHex = balanceHex.startsWith('0x') ? balanceHex.slice(2) : balanceHex;
    // Convertir de hex a decimal
    const balance = BigInt('0x' + cleanHex).toString();
    
    return Number(balance) / 1_000_000;
  } catch (error) {
    const errorMessage = error?.message || error?.toString() || String(error) || "Error desconocido";
    throw new Error(`Error al obtener balance USDT: ${errorMessage}`);
  }
}

async function sendUsdt(from, pk, to, amount) {
  try {
    if (!config.tron.usdtContract) {
      return { ok: false, error: "USDT_CONTRACT no está configurado" };
    }
    const usdtAmount = amount * 1_000_000;

    const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
      config.tron.usdtContract,
      "transfer(address,uint256)",
      {},
      [
        { type: "address", value: to },
        { type: "uint256", value: usdtAmount }
      ],
      from
    );

    if (!transaction?.transaction) {
      return { ok: false, error: "Transaction build failed" };
    }

    tronWeb.setPrivateKey(pk);

    const signed = await tronWeb.trx.sign(transaction.transaction);
    const result = await tronWeb.trx.sendRawTransaction(signed);

    if (!result?.result) {
      return { ok: false, error: "Broadcast failed" };
    }

    return { ok: true, txid: result.txid };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function sendTrx(from, pk, to, amount) {
  try {
    const trxAmount = amount * 1_000_000;
    const TronWeb = require("tronweb");
    const tronWebInstance = new TronWeb({
      fullHost: config.tron.fullNode,
      privateKey: pk
    });

    const transaction = await tronWebInstance.trx.sendTransaction(to, trxAmount, from);

    if (!transaction?.result) {
      return { ok: false, error: "Transaction failed" };
    }

    return { ok: true, txid: transaction.txid };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function getTrc20Transfers(address, limit = 50, fingerprint = null) {
  try {
    if (!config.tron.usdtContract) {
      throw new Error("USDT_CONTRACT no está configurado");
    }
    
    const params = {
      limit,
      contract_address: config.tron.usdtContract
    };

    if (fingerprint) params.fingerprint = fingerprint;

    const headers = {
      "Content-Type": "application/json"
    };

    if (config.tron.tronGridApiKey) {
      headers["TRON-PRO-API-KEY"] = config.tron.tronGridApiKey;
    }

    const resp = await axios.get(
      `${config.tron.tronGridBase}/v1/accounts/${address}/transactions/trc20`,
      { params, headers }
    );

    return resp.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Error de TronGrid: ${error.response.data?.error || error.response.statusText}`);
    }
    throw new Error(`Error al obtener transacciones TRC20: ${error.message}`);
  }
}

async function getAddressFromPrivateKey(privateKey) {
  const TronWeb = require("tronweb");
  const tronWeb = new TronWeb({
    fullHost: config.tron.fullNode,
    privateKey: privateKey
  });
  return tronWeb.address.fromPrivateKey(privateKey);
}

module.exports = {
  createWallet,
  isValidAddress,
  getTrxBalance,
  getUsdtBalance,
  sendUsdt,
  sendTrx,
  getTrc20Transfers,
  getAddressFromPrivateKey
};
