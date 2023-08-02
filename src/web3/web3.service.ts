/* eslint-disable*/
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Web3 } from 'web3';
import BN from 'bn.js';
import { HttpService } from '@nestjs/axios';

import { Coin } from 'src/database/wallet/wallet.entity';
import { DatabaseService } from 'src/database/database.service';
import { ErrorSave } from 'src/database/error_handling.entity';
@Injectable()

export class Web3Service {
  private ethConfirmationCountTarget = 12;
  private bscConfirmationCountTarget = 4;
  constructor(
    @Inject('Web3')
    private readonly web3: Web3,
    @Inject('EthWeb3')
    private readonly ethWeb3: Web3,
    private readonly httpService: HttpService,
    private readonly dbService: DatabaseService,
  ) {
    console.log('i m calle')
   // this.c();
  }
  async getCurrentBlock() {
    let blocknumber = this.web3.eth.getBlockNumber();
    return blocknumber;

  }
  async findTransactionForDeposit(address: string, amount: number, coin: Coin, network: string, blocknumber: number) {
    let bscscan_api_url = 'https://api-testnet.bscscan.com/api';
    let etherscan_api_url = 'https://api-testnet.etherscan.com/api';
    let url = network == 'BEP20' ? bscscan_api_url : etherscan_api_url;
    // let address = '0x3AFE52271B95ef328d9FcBefBbCCbA12FA6d2745';
    let apikey = 'UKHMWR7KTHCRJJVUFJTDUWRUYA2QXCC5MQ';
    let found_transaction = null;
     const targetCount =
       network == 'BEP20'
         ? this.bscConfirmationCountTarget
         : this.ethConfirmationCountTarget;
    
    try {
      let res1 = await this.httpService.axiosRef.get(url, {
        params: {
          module: 'account',
          action: 'txlist',
          address: address,
          startblock: blocknumber,
          sort: 'asc',
          apikey: apikey,
        },
      });
      let tx_list = res1.data.result;
      if (tx_list.length > 0) {
        const erc20TransferABI = [
          {
            type: 'address',
            name: 'receiver',
          },
          {
            type: 'uint256',
            name: 'amount',
          },
        ];
        
        tx_list.forEach(async(v) => {
          try {
            let decoded = this.web3.eth.abi.decodeParameters(
              erc20TransferABI,
              v.input.slice(10),
            );
            let deposit_amount= this.web3.utils.fromWei(decoded.amount.toString(), 'ether');
            let receiver_address = decoded.to;
            if (
              address == receiver_address &&
              v.blockNumber > blocknumber &&
              amount.toString() == deposit_amount
            ) {
               const confirmationCount = await this.getConfirmations(
                 v.hash,
                 network,
              );
              if (confirmationCount >= targetCount) 
                {
                  v.input = decoded;
                  found_transaction = v;
                }
                else
                   found_transaction = confirmationCount;
               return
            }
          } catch (err) {

          }
        })
      }
    }
    catch (error) { 
       await this.dbService.saveError({error: error,from: `When searc hing deposit transaction status from ${address} of amount ${amount}` } as  ErrorSave);
    }
    return  found_transaction;
  }

  async testScanApi() {
    let timestamp = 1688453728;
    // let timestamp = 1688476203;
    let blocknumber;
    let address = '0x3AFE52271B95ef328d9FcBefBbCCbA12FA6d2745';
    let apikey = 'UKHMWR7KTHCRJJVUFJTDUWRUYA2QXCC5MQ';
    let urltimestamp = 'https://api-testnet.bscscan.com/api';
    console.log(urltimestamp);
    console.log('i m calle tie4444');
    let res = await this.httpService.axiosRef.get(urltimestamp, {
      params: {
        module: 'block',
        action: 'getblocknobytime',
        timestamp: timestamp,
        closest: 'before',
        apikey: apikey,
      },
    });
    let block = res.data.result;
    console.log('re', res.data);

    let res1 = await this.httpService.axiosRef.get(urltimestamp, {
      params: {
        module: 'account',
        action: 'txlist',
        address: address,
        startblock: block,
        sort: 'asc',
        apikey: apikey,
      },
    });
    const erc20TransferABI = [
      {
        type: 'address',
        name: 'receiver',
      },
      {
        type: 'uint256',
        name: 'amount',
      },
    ];
    let list = res1.data.result.map(v => {
      try {
        let decoded = this.web3.eth.abi.decodeParameters(
          erc20TransferABI,
          v.input.slice(10),
        );
        v.input = decoded;
        return v;
      } catch (err) {

      }
    })
    console.log(list);




  }
  async receipt(hash: string, from_address: string, network: string): Promise<any> {
    let g: any =
      network == 'BEP20'
        ? await this.web3.eth.getTransactionReceipt(hash)
        : await this.ethWeb3.eth.getTransactionReceipt(hash);
    const targetCount = network == 'BEP20' ? this.bscConfirmationCountTarget : this.ethConfirmationCountTarget
    const confirmationCount = await this.getConfirmations(g.transactionHash, network)
    if (g) {
      if (
        g.transactionHash == hash &&
        g.from.toLowerCase() == from_address.toLowerCase() && confirmationCount >= targetCount
      ) {
        g.confirmationCount = confirmationCount;
        return g;
      }
    } else return confirmationCount;
  }
  async getConfirmations(txHash, network: string) {
    try {
      // Instantiate web3 with HttpProvider
      const web3 = network == 'BEP20' ? this.web3 : this.ethWeb3;

      // Get transaction details
      const trx = await web3.eth.getTransaction(txHash)

      // Get current block number
      const currentBlock = await web3.eth.getBlockNumber()

      // When transaction is unconfirmed, its block number is null.
      // In this case we return 0 as number of confirmations
      return trx.blockNumber === null ? 0 : currentBlock - BigInt(trx.blockNumber)
    }
    catch (error) {
      await this.dbService.saveError({ error: error as string, from: 'Get confirmations function ' } as ErrorSave)
    }
  }
}
