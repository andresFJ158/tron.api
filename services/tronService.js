const axios = require("axios");
const tronWeb = require("../tronWeb.js");
const config = require("../config/config.js");

async function createWallet() {
  const account = await tronWeb.createAccount();
  return {
    address: account.address.base58,
    privateKey: account.privateKey
  };
}

async function isValidAddress(address) {
  return tronWeb.isAddress(address);
}

async function getTrxBalance(address) {
  const balance = await tronWeb.trx.getBalance(address);
  return balance / 1_000_000; // SUN → TRX
}

async function getUsdtBalance(address) {
  const contract = await tronWeb.contract().at(config.tron.usdtContract);
  const result = await contract.balanceOf(address).call();
  return Number(result.toString()) / 1_000_000;
}

async function sendUsdt(from, pk, to, amount) {
  try {
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
  const params = {
    limit,
    contract_address: config.tron.usdtContract
  };

  if (fingerprint) params.fingerprint = fingerprint;

  const headers = {
    "Content-Type": "application/json",
    "TRON-PRO-API-KEY": config.tron.tronGridApiKey
  };

  const resp = await axios.get(
    `${config.tron.tronGridBase}/v1/accounts/${address}/transactions/trc20`,
    { params, headers }
  );

  return resp.data;
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
