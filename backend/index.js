const express = require('express');
const app = express();
const port = 5001;
const Moralis = require('moralis').default;
const cors = require('cors');

require('dotenv').config({ path: '.env' });

app.use(cors());
app.use(express.json());

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const CHAIN = '0x1';

app.get('/getethprice', async (req, res) => {
  try {
    const response = await Moralis.EvmApi.token.getTokenPrice({
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      chain: CHAIN,
    });
    return res.status(200).json(response);
  } catch (e) {
    console.log(`Somthing went wrong ${e}`);
    return res.status(400).json();
  }
});

app.get('/:address/transactions', async (req, res) => {
  try {
    const { address } = req.params;
    const chain = CHAIN;

    const response =
      await Moralis.EvmApi.transaction.getWalletTransactionsVerbose({
        address: address, // wallet address
        chain,
        limit: 25,
      });

    return res.status(200).json(response);
  } catch (e) {
    console.log(`Something went wrong ${e}`);
    return res.status(400).json();
  }
});

app.get('/getblockinfo', async (req, res) => {
  try {
    const latestBlock = await Moralis.EvmApi.block.getDateToBlock({
      date: Date.now(),
      chain: CHAIN,
    });

    let blockNrOrParentHash = latestBlock.toJSON().block;
    let previousBlockInfo = [];

    for (let i = 0; i < 5; i++) {
      const previousBlockNrs = await Moralis.EvmApi.block.getBlock({
        chain: CHAIN,
        blockNumberOrHash: blockNrOrParentHash,
      });

      blockNrOrParentHash = previousBlockNrs.toJSON().parent_hash;
      if (i == 0) {
        // the latest block basic info
        previousBlockInfo.push({
          transactions: previousBlockNrs.toJSON().transactions.map((i) => {
            return {
              transactionHash: i.hash,
              time: i.block_timestamp,
              fromAddress: i.from_address,
              toAddress: i.to_address,
              value: i.value,
            };
          }),
        });
      }
      previousBlockInfo.push({
        blockNumber: previousBlockNrs.toJSON().number,
        totalTransactions: previousBlockNrs.toJSON().transaction_count,
        gasUsed: previousBlockNrs.toJSON().gas_used,
        miner: previousBlockNrs.toJSON().miner,
        time: previousBlockNrs.toJSON().timestamp,
      });
    }

    const response = {
      latestBlock: latestBlock.toJSON().block,
      previousBlockInfo, // latest 5 blocks info
    };

    return res.status(200).json(response);
  } catch (e) {
    console.log(`Somthing went wrong ${e}`);
    return res.status(400).json();
  }
});

Moralis.start({
  apiKey: MORALIS_API_KEY,
}).then(() => {
  app.listen(port, () => {
    console.log(`Listening on ${port} for API calls...`);
  });
});
