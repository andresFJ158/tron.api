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
    const contract = await tronWeb.contract().at(config.tron.usdtContract);
    const result = await contract.balanceOf(address).call();
    return Number(result.toString()) / 1_000_000;
  } catch (error) {
    throw new Error(`Error al obtener balance USDT: ${error.message}`);
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
