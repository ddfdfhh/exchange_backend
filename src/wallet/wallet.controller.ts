/* eslint-disable*/
import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
const CryptoAccount = require('send-crypto');

var crypto = require('crypto');
import { ethers } from 'ethers';
import { DatabaseService } from 'src/database/database.service';
import { GetNetworkFeesDto } from 'src/dto/fees_network.dto';
import { GetAddressDto } from 'src/dto/get_address.dto';
import { WithdrawalDto } from 'src/dto/withdrawal.dto';

import { HttpService } from '@nestjs/axios';
import { Coin } from 'src/database/wallet/wallet.entity';
import { Status } from 'src/database/withdrawal_entity/withdrawal.entity';
import { DepositDto } from 'src/dto/deposit.dto';
import { ErrorSave } from 'src/database/error_handling.entity';
import { YesNo } from 'src/database/user/user.entity';
import { UsdtTransferDto } from 'src/dto/usdt_transfer.dto';
//const bitcoin = require('bitcoinjs-lib');
const { BncClient } = require('@binance-chain/javascript-sdk');
type WithdrawlResponse = {
  success: boolean;
  message: string;
  hash?: string;
  blockHash?: string;
};
//const crypto = require('crypto');
//const bitcore = require('bitcore-lib');

@Controller('wallet')
export class WalletController {
  private bsc_api_url = 'https://api-testnet.bscscan.com/api';
  private eth_api_url = 'https://api-testnet.etherscan.com/api';

  private bsc_testnet_url = 'https://data-seed-prebsc-1-s2.binance.org:8545';
  private bsc_mainnet_url = 'https://bsc-dataseed3.binance.org';
  private current_bsc_url = this.bsc_mainnet_url;
  private ethProvider;
  private bscProvider;
  private bscTransactionOptionTestnet;
  private bscTransactionOptionMainnet;
  private bscTransactionOption;
  private ethTransactionOptionTestnet;
  private ethTransactionOptionMainnet;
  private ethTransactionOption;
  private btcnetwork = 'Testnet';
  private fees = 0;
  constructor(
    @Inject(DatabaseService)
    private readonly dbService: DatabaseService,
    private readonly httpService: HttpService,
  ) {
    this.ethProvider = new ethers.providers.InfuraProvider(
      'sepolia',
      '55739af7e34c455ba6d78e039362c4a5',
    );
    this.bscProvider = new ethers.providers.JsonRpcProvider(
      this.current_bsc_url,
    );
    this.bscTransactionOptionTestnet = {
      gasLimit: ethers.utils.hexlify(9000000),

      gasPrice: 10000000000 /*10Gweit=0.00000001 BNB */,
    };
    this.bscTransactionOptionMainnet = {
      gasLimit: ethers.utils.hexlify(52000),

      gasPrice: 3000000000 /*3Gweit=0.00000001 BNB */,
    };
    this.ethTransactionOptionTestnet = {
      gasLimit: ethers.utils.hexlify(52000),

      gasPrice: 1500000000 /*2Gweit=0.00000001 BNB */,
    };
    this.ethTransactionOptionMainnet = {
      gasLimit: ethers.utils.hexlify(52000),

      gasPrice: 12000000000 /*10Gweit=0.00000001 BNB */,
    };
    this.bscTransactionOption =
      this.current_bsc_url == this.bsc_mainnet_url
        ? this.bscTransactionOptionMainnet
        : this.bscTransactionOptionTestnet;
    this.ethTransactionOption = this.ethTransactionOptionMainnet;
  }

  @Post('getAddress')
  async genAddress(@Body() getAddressDto: GetAddressDto) {
    let wallet = await this.dbService.searchAddress(
      getAddressDto.user_id,
      getAddressDto.network,
    );
    if (wallet) {
      return { address: wallet.deposit_address };
    } else {
      let { address, privateKey } = await this.generateAdress(
        getAddressDto.network,
      );
      console.log('addres gene', address, privateKey);

      let wallet = await this.dbService.saveAddress(
        getAddressDto.user_id,

        getAddressDto.network,
        address,
        privateKey,
      );

      return { address: wallet.deposit_address };
    }
  }
  @Post('getBalance')
  async genBalance(@Body() getAddressDto: GetAddressDto) {
    const [wallet, fees_row, todayWithdrawn] = await Promise.all([
      this.dbService.searchAddress(
        getAddressDto.user_id,
        getAddressDto.network,
      ),
      this.dbService.getNetworkFees(getAddressDto.network),
      this.dbService.todayWithrawn(
        getAddressDto.user_id,
        getAddressDto.coin,
        getAddressDto.network,
      ),
    ]);
    let balance_column = getAddressDto.coin.toLowerCase() + '_balance';
    return {
      balance: wallet[balance_column],
      fees: fees_row.fees,
      todayWithdrawn,
      totalLimit: fees_row.with_limit,
    };
  }
  @Post('network_fees')
  async get_network_fees(@Body() feesDto: GetNetworkFeesDto) {
    const nwFees = await this.dbService.getNetworkFees(feesDto.network);
    return nwFees.fees;
  }
  @Post('withdrawal')
  async withdrawal(
    @Body() withdrawalDto: WithdrawalDto,
  ): Promise<WithdrawlResponse> {
    const { user_id, coin, network, amount, to_address, memo, fees, balance } =
      withdrawalDto;
    try {
      const nw_fees = await this.dbService.getNetworkFees(network);
      const myWallet = await this.dbService.searchAddress(
        withdrawalDto.user_id,

        withdrawalDto.network,
      );
      const balance_column = withdrawalDto.coin.toLowerCase() + '_balance';
      const wallet_balance = myWallet[balance_column];
      if (amount + nw_fees.fees > wallet_balance) {
        return { success: false, message: 'Insufficient blalance in wallet' };
      }
      const total_payable = amount;
      let result: WithdrawlResponse;
      const tokenAdressRow = await this.dbService.findDbWithdrawalSourceAddress(
        coin,
        network,
        amount + nw_fees.fees,
      );
      let from_address = null;
      if (typeof tokenAdressRow != 'boolean')
        /**if boolean means return is false so no address found  */
        from_address = tokenAdressRow.address;
      if (from_address) {
        if (coin == 'BTC') {
          if (network == 'Bitcoin') {
            result = await this.sendBitcoin(
              total_payable,
              withdrawalDto.to_address,
              myWallet.privateKey,
              nw_fees.fees,
            );
          } else {
            result = await this.transferBep20(
              amount,
              to_address,
              myWallet.privateKey,
              'BTC',
              nw_fees.fees,
            );
          }
        } else if (coin == 'USDT') {
          if (network == 'ERC20')
            result = await this.sendUSDTERC20(
              amount,
              to_address,
              myWallet.privateKey,
              nw_fees.fees,
            );
          else if (network == 'BEP20')
            result = await this.transferBep20USDT(
              amount,
              to_address,
              myWallet.privateKey,
              'USDT',
              nw_fees.fees,
            );
        } else if (coin == 'ETH') {
          result = await this.transferETH(
            amount,
            to_address,
            myWallet.privateKey,
            nw_fees.fees,
          );
        } else if (coin == 'DRNH') {
          result = await this.transferBep20(
            amount,
            to_address,
            myWallet.privateKey,
            'DRNH',
            nw_fees.fees,
          );
        } else if (coin == 'BNB') {
          if (network == 'BEP20') {
            result = await this.transferBNBBep20(
              amount,
              to_address,
              myWallet.privateKey,
              nw_fees.fees,
            );
          } else if (network == 'BEP2') {
            result = await this.transferBNBBep2(
              amount,
              to_address,
              myWallet.privateKey,
              'memo',
            );
          }
        }
        if (result['hash'] !== undefined && result['success']) {
          this.dbService.saveWithdrawal(
            user_id,
            from_address,
            to_address,
            coin,
            network,
            amount,
            result['hash'],
            result['blockHash'] !== undefined
              ? Status.Approved
              : Status.Pending,
          );
        }

        return result;
      } else {
        /**save for admin payment */
        this.dbService.saveWithdrawal(
          user_id,
          null,
          to_address,
          coin,
          network,
          amount,
          null,
          Status.Pending,
          YesNo.YES,
        );
      }
      return {
        success: true,
        message: 'Withdrawal Request placed successfully,',
      };
    } catch (error) {
      await this.dbService.saveError({
        error: error,
        from: 'Withdrawal function',
      } as ErrorSave);
      return {
        success: false,
        message: 'Failed to accept withdrawal at the moment,Try after sometime',
      };
    }
  }
  @Post('deposit')
  async deposit(
    @Body() depositDto: DepositDto,
  ): Promise<{ success: boolean; message: string }> {
    const { user_id, coin, network, to_address } = depositDto;
    try {
      const alreadyExist = await this.dbService.checkForPendingDeposit(
        user_id,
        coin as Coin,
        network,
        to_address,
      );
      if (!alreadyExist) {
        const apikey = 'UKHMWR7KTHCRJJVUFJTDUWRUYA2QXCC5MQ';
        const api_url =
          network == 'BEP20' ? this.bsc_api_url : this.eth_api_url;
        let current_block = null;
        try {
          let res = await this.httpService.axiosRef.get(api_url, {
            params: {
              module: 'block',
              action: 'getblocknobytime',
              timestamp: new Date().getTime(),
              closest: 'before',
              apikey: apikey,
            },
          });
          let current_block = res.data.result;
          console.log('api provided block', current_block);
        } catch (error) {
          await this.dbService.saveError({
            error: error,
            from: 'Block Number api call from depost function',
          } as ErrorSave);
          const provider =
            network == 'BEP20' ? this.bscProvider : this.ethProvider;
          current_block =await provider.getBlockNumber();
          console.log('providder prduced block number', current_block);
        }
        if (!current_block) {
          await this.dbService.saveError({
            error: `No current block for user id ${user_id} -adress:${to_address} coin:${coin} network:${network}`,
            from: `No current block found in deposit function `,
          } as ErrorSave);
          return {
            success: false,
            message: 'Failed to accept deposit currently,Please wait',
          };
        }
        try {
          const w = await this.dbService.saveDeposit(
            user_id,
            to_address,
            coin as Coin,
            network,
            current_block,
          );
        } catch (error) {
          await this.dbService.saveError({
            error: error,
            from: `while saving deposit in  deposit function walet comtrller user id ${user_id} -adress:${to_address} coin:${coin} network:${network}`,
          } as ErrorSave);
          return {
            success: error,
            message: 'Failed to accept deposit currently,Please wait',
          };
        }
      } else {
        return {
          success: false,
          message:
            'There is already a pending transaction at this addresss,Please wait',
        };
      }
    } catch (error) {
      await this.dbService.saveError({
        error: error,
        from: `Error  deposit function walet comtrller user id ${user_id} -adress:${to_address} coin:${coin} network:${network}`,
      } as ErrorSave);
      return {
        success: false,
        message: 'Failed to accept deposit currently,Please wait',
      };
    }
  }

  async sendUSDTERC20(
    amount1,
    to_address,
    privateKey,
    fees,
  ): Promise<WithdrawlResponse> {
    const provider = this.ethProvider;
    try {
      const gasPrice = (await provider.getFeeData()).gasPrice;
      let signer = new ethers.Wallet(privateKey, provider);
      const [tokenContract, abi] = this.getABiAndTokenContract('USDT', 'ERC20');
      let contract = new ethers.Contract(tokenContract, abi, signer);
      const fromAddress = new ethers.Wallet(privateKey).address;
      let bal = await contract.balanceOf(fromAddress);
      let balanceInBNB = ethers.utils.formatEther(bal);
      console.log('bnbn', balanceInBNB);
      console.log('bal', ethers.utils.formatEther(bal));
      let amount = ethers.utils.parseUnits(amount1, 18);
      console.log('amount', BigInt(amount._hex).toString());
      let tx = await contract.transfer(
        to_address,
        amount /***amount is in wei so amount converted above  */,
        this.ethTransactionOption,
      );
      let g = await tx.wait();
      console.log('rece', g);
      return {
        success: true,
        message: 'USDT  transfreed succsfully',
        hash: g.transactionHash,
        blockHash: g.blockHash,
      };
    } catch (error: any) {
      return { success: false, message: 'Transfer Failed ' + error };
    }
  }
  async generateAdress(
    network1,
  ): Promise<{ address: string; privateKey: string }> {
    const privateKey = CryptoAccount.newPrivateKey();

    let network = network1;
    let account = null;
    if (network == 'Bitcoin') {
      account = new CryptoAccount(privateKey, { network: network1 });
      return { address: await account.address('BTC'), privateKey: privateKey };
    } else if (
      network == 'BEP20' ||
      network == 'ERC20' ||
      network == 'Ethereum'
    ) {
      let id = crypto.randomBytes(32).toString('hex');
      let privateKey = '0x' + id;
      var wallet = new ethers.Wallet(privateKey);
      console.log('Address: ' + wallet.address);
      return { address: wallet.address, privateKey: id };
    } else if (network == 'BEP2') return this.getBnbAddress();
  }
  async sendBitcoin(amount, to_address, privateKey, fees) {
    console.log('logg', amount, to_address, privateKey);
    const account = new CryptoAccount(privateKey, {
      network: this.btcnetwork,
    });

    const balance = await account.getBalance('BTC');
    if (amount + fees > parseFloat(balance)) {
      console.log('amount error');
      return { success: false, message: 'amount exceeded than in wallet' };
    }

    const hash = await account.send(to_address, amount, 'BTC');
    console.log('hashhh', hash);
    if (hash) return { success: true, message: 'Transfer Successful', hash };
    else return { success: false, message: 'Trasaction Failed' };
  }
  async getConfirmationsCount(hash) {
    //
    // In most cases, one confirmation is considered enough for smaller
    //  transactions below $1,000, three confirmations are best for transactions up to $1,000,
    // and six confirmations are standard for transactions up to $1,000,000.
    //const Socket = require('blockchain.info/Socket');
    // const mySocket = new Socket();
    // mySocket.onTransaction(function () {
    //   console.log(arguments);
    // });
    // for mmainenthttps://api.blockcypher.com/v1/btc/main/txs/{transaction_hash}
    //fr testnet https://api.blockcypher.com/v1/btc/test3/txs/{transaction_hash}
    // tx_hash = '5e910a5b61e3ccdb7...'; // try to get a new tx hash from blockchain.info/.com
    // bcinfo = json_decode(file_get_contents("https://blockchain.info/rawtx/".$tx_hash), true);
    // latest = json_decode(file_get_contents("https://blockchain.info/latestblock"), true);
    // if (isset($bcinfo['block_height'])) {
    //   $block_height = $bcinfo['block_height'];
    //   $height = $latest['height'];
    //   response($height - $block_height + 1);
    // } else {
    //   response(0); // not yet has any confirmations
    try {
      let result = await this.httpService.axiosRef.get(
        'https://api.blockcypher.com/v1/btc/test3/txs/' + hash,
      );

      let transactionBlockInfo = result.data;

      console.log('pllrr', transactionBlockInfo);
      let latestblockresult = await this.httpService.axiosRef.get(
        'https://api.blockcypher.com/v1/btc/test3',
      );

      let latestBlockInfo = latestblockresult.data;
      console.log(
        'late block res',
        transactionBlockInfo['block_height'],
        latestBlockInfo['height'],
      );
      if (
        transactionBlockInfo['block_height'] !== undefined &&
        transactionBlockInfo['block_height'] > -1
      ) {
        let transaction_block_height = transactionBlockInfo['block_height'];
        let latest_block_height = latestBlockInfo['height'];
        let count = latest_block_height - transaction_block_height + 1;
        console.log('count44', count);
        return count;
      } else {
        return 0;
      }
    } catch (err) {
      await this.getConfirmationsCount(hash);
    }
  }
  async transferBep20(
    amount1,
    to_address,
    privateKey,
    coin,
    fees,
  ): Promise<WithdrawlResponse> {
    try {
      const fromAddress = new ethers.Wallet(privateKey).address;
      const [tokenContract, abi] = this.getABiAndTokenContract(coin, 'BEP20');

      const provider = this.bscProvider;
      const gasPrice = (await provider.getFeeData()).gasPrice;
      let signer = new ethers.Wallet(privateKey, provider);
      let contract = new ethers.Contract(tokenContract, abi, signer);
      let bal = await contract.functions.balanceOf(fromAddress);

      let weiBalanceBigNumber = BigInt(bal[0]._hex).toString();
      let balanceInSymobl = ethers.utils.formatEther(weiBalanceBigNumber);
      console.log('balance in symbol', balanceInSymobl);
      let amount = ethers.utils.parseUnits(amount1, 18);
      console.log('transferring amount', amount1);
      if (balanceInSymobl < amount1 + fees) {
        return {
          success: false,
          message: 'Insufficient Amount',
          hash: '',
        };
      }
      const data = new ethers.utils.Interface(abi).encodeFunctionData(
        'transfer',
        [to_address, amount],
      );

      const tx = {
        from: signer.address,
        to: tokenContract,
        value: 0x00 /***it should be zero for erc20 or bep 20 transfer  */,
        data: data,
        gasLimit: this.bscTransactionOption.gasLimit,
        gasPrice: this.bscTransactionOption.gasPrice,
      };
      const tf = await signer.sendTransaction(tx);
      console.log('recept', tf);
      const receipt = await tf.wait();
      return {
        success: true,
        message: coin + ' transfered succsfully',
        hash: receipt.transactionHash,
        blockHash: receipt.blockHash,
      };
    } catch (error: any) {
      return { success: false, message: 'Transfer Failed ' + error };
    }
  }
  async transferBep20USDT(
    amount1,
    to_address,
    privateKey,
    coin,
    fees,
  ): Promise<WithdrawlResponse> {
    try {
      const fromAddress = new ethers.Wallet(privateKey).address;
      const [tokenContract, abi] = this.getABiAndTokenContract('USDT', 'BEP20');

      const provider = new ethers.providers.JsonRpcProvider(
        this.current_bsc_url,
      );
      const gasPrice = (await provider.getFeeData()).gasPrice;
      let signer = new ethers.Wallet(privateKey, provider);
      const contract = new ethers.Contract(tokenContract, abi, signer);

      let bal = await contract.functions.balanceOf(fromAddress);

      let weiBalanceBigNumber = BigInt(bal[0]._hex).toString();
      let balanceInSymobl = ethers.utils.formatEther(weiBalanceBigNumber);
      console.log('balance in symbol', balanceInSymobl);
      let amount = ethers.utils.parseUnits(amount1, 18);

      if (balanceInSymobl < amount1 + fees) {
        return {
          success: false,
          message: 'Insufficient Amount',
          hash: '',
        };
      }

      let tx = await contract.transfer(
        to_address,
        amount,
        this.bscTransactionOption,
      );
      let g = await tx.wait();
      console.log('rece', g);
      return {
        success: true,
        message: coin + ' transfreed succsfully',
        hash: g.transactionHash,
        blockHash: g.blockHash,
      };
    } catch (error: any) {
      return { success: false, message: 'Transfer Failed ' + error };
    }
  }

  async transferETH(amount1, to_address, privateKey, fees) {
    const provider = this.ethProvider;
    const fromAddress = new ethers.Wallet(privateKey).address;

    let balance = await provider.getBalance(fromAddress);

    let balanceInETH = ethers.utils.formatEther(balance);
    console.log('bal Actual Eth', balanceInETH);
    let amount = ethers.utils.parseEther(amount1);

    if (balanceInETH < amount1 + fees) {
      return {
        success: false,
        message: 'Insufficient Amount',
        hash: '',
      };
    }
    let signer = new ethers.Wallet(privateKey, provider);
    const tx = {
      from: fromAddress,
      to: to_address,
      value: amount /***it should be zero for erc20 or bep 20 transfer  */,

      gasLimit: this.ethTransactionOption.gasLimit,
      nonce: provider.getTransactionCount(fromAddress, 'latest'),
    };
    const tf = await signer.sendTransaction(tx);
    const receipt = await tf.wait();
    console.log('reept', receipt);
    return {
      success: true,
      message: 'Trasaction successfull',
      hash: receipt.transactionHash,
      blockHash: receipt.blockHash,
    };
  }
  async transferBNBBep20(amount1, to_address, privateKey, fees) {
    const provider = new ethers.providers.JsonRpcProvider(this.current_bsc_url);
    const fromAddress = new ethers.Wallet(privateKey).address;

    let balance = await provider.getBalance(fromAddress);
    let balanceInBNB = ethers.utils.formatEther(balance);
    console.log('bal Actual BNB', balanceInBNB);
    if (balanceInBNB < amount1 + fees) {
      return {
        success: false,
        message: 'Insufficient Amount',
        hash: '',
      };
    }
    let signer = new ethers.Wallet(privateKey, provider);
    let amount = ethers.utils.parseEther(amount1);
    const tx = {
      from: fromAddress,
      to: to_address,
      value: amount /***it should be zero for erc20 or bep 20 transfer  */,

      gasLimit: this.bscTransactionOption.gasLimit,

      gasPrice: this.bscTransactionOption.gasPrice,

      nonce: provider.getTransactionCount(fromAddress, 'latest'),
    };
    const tf = await signer.sendTransaction(tx);
    const receipt = await tf.wait();
    console.log('reept', receipt);
    return {
      success: true,
      message: 'Trasaction successfull',
      hash: receipt.transactionHash,
      blockHash: receipt.blockHash,
    };
  }

  async transferERC20SendCrypto(amount1, to_address, privateKey, coin) {
    const account = new CryptoAccount(privateKey);
    // const to_address = '0x05a56e2d52c817161883f50c441c3228cfe54d9f';
    const [tokenAddress] = this.getABiAndTokenContract(coin, 'ERC20');
    const hash = await account.send(to_address, amount1, {
      type: 'ERC20',
      address: tokenAddress,
    });
    return { success: true, message: 'Trasaction successfull', hash };
  }

  getBnbAddress() {
    const bnbClient = new BncClient('https://testnet-dex.binance.org');
    bnbClient.initChain();
    let account = bnbClient.createAccount();
    console.log('bnb account', account);
    return { address: account.address, privateKey: account.privateKey };
  }

  getABiAndTokenContract(coin, network) {
    let tokenAddress = '';
    let abi = null;
    if (coin == 'BUSD') {
      console.log('hihehrhhe');
      tokenAddress = '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee';
      abi = [
        {
          constant: false,
          inputs: [],
          name: 'disregardProposeOwner',
          outputs: [],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: true,
          inputs: [],
          name: 'name',
          outputs: [{ name: '', type: 'string' }],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: false,
          inputs: [
            { name: '_spender', type: 'address' },
            { name: '_value', type: 'uint256' },
          ],
          name: 'approve',
          outputs: [{ name: '', type: 'bool' }],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: true,
          inputs: [],
          name: 'assetProtectionRole',
          outputs: [{ name: '', type: 'address' }],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: true,
          inputs: [],
          name: 'totalSupply',
          outputs: [{ name: '', type: 'uint256' }],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: false,
          inputs: [
            { name: 'r', type: 'bytes32[]' },
            { name: 's', type: 'bytes32[]' },
            { name: 'v', type: 'uint8[]' },
            { name: 'to', type: 'address[]' },
            { name: 'value', type: 'uint256[]' },
            { name: 'fee', type: 'uint256[]' },
            { name: 'seq', type: 'uint256[]' },
            { name: 'deadline', type: 'uint256[]' },
          ],
          name: 'betaDelegatedTransferBatch',
          outputs: [{ name: '', type: 'bool' }],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: false,
          inputs: [
            { name: 'sig', type: 'bytes' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'fee', type: 'uint256' },
            { name: 'seq', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
          name: 'betaDelegatedTransfer',
          outputs: [{ name: '', type: 'bool' }],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: false,
          inputs: [
            { name: '_from', type: 'address' },
            { name: '_to', type: 'address' },
            { name: '_value', type: 'uint256' },
          ],
          name: 'transferFrom',
          outputs: [{ name: '', type: 'bool' }],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: false,
          inputs: [],
          name: 'initializeDomainSeparator',
          outputs: [],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: true,
          inputs: [],
          name: 'decimals',
          outputs: [{ name: '', type: 'uint8' }],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: false,
          inputs: [],
          name: 'unpause',
          outputs: [],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: false,
          inputs: [{ name: '_addr', type: 'address' }],
          name: 'unfreeze',
          outputs: [],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: false,
          inputs: [],
          name: 'claimOwnership',
          outputs: [],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: false,
          inputs: [{ name: '_newSupplyController', type: 'address' }],
          name: 'setSupplyController',
          outputs: [],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: true,
          inputs: [],
          name: 'paused',
          outputs: [{ name: '', type: 'bool' }],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: true,
          inputs: [{ name: '_addr', type: 'address' }],
          name: 'balanceOf',
          outputs: [{ name: '', type: 'uint256' }],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: false,
          inputs: [],
          name: 'initialize',
          outputs: [],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: false,
          inputs: [],
          name: 'pause',
          outputs: [],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: true,
          inputs: [],
          name: 'getOwner',
          outputs: [{ name: '', type: 'address' }],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: true,
          inputs: [{ name: 'target', type: 'address' }],
          name: 'nextSeqOf',
          outputs: [{ name: '', type: 'uint256' }],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: false,
          inputs: [{ name: '_newAssetProtectionRole', type: 'address' }],
          name: 'setAssetProtectionRole',
          outputs: [],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: false,
          inputs: [{ name: '_addr', type: 'address' }],
          name: 'freeze',
          outputs: [],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: true,
          inputs: [],
          name: 'owner',
          outputs: [{ name: '', type: 'address' }],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: true,
          inputs: [],
          name: 'symbol',
          outputs: [{ name: '', type: 'string' }],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: false,
          inputs: [{ name: '_newWhitelister', type: 'address' }],
          name: 'setBetaDelegateWhitelister',
          outputs: [],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: false,
          inputs: [{ name: '_value', type: 'uint256' }],
          name: 'decreaseSupply',
          outputs: [{ name: 'success', type: 'bool' }],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: true,
          inputs: [{ name: '_addr', type: 'address' }],
          name: 'isWhitelistedBetaDelegate',
          outputs: [{ name: '', type: 'bool' }],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: false,
          inputs: [
            { name: '_to', type: 'address' },
            { name: '_value', type: 'uint256' },
          ],
          name: 'transfer',
          outputs: [{ name: '', type: 'bool' }],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: false,
          inputs: [{ name: '_addr', type: 'address' }],
          name: 'whitelistBetaDelegate',
          outputs: [],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: false,
          inputs: [{ name: '_proposedOwner', type: 'address' }],
          name: 'proposeOwner',
          outputs: [],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: false,
          inputs: [{ name: '_value', type: 'uint256' }],
          name: 'increaseSupply',
          outputs: [{ name: 'success', type: 'bool' }],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: true,
          inputs: [],
          name: 'betaDelegateWhitelister',
          outputs: [{ name: '', type: 'address' }],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: true,
          inputs: [],
          name: 'proposedOwner',
          outputs: [{ name: '', type: 'address' }],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: false,
          inputs: [{ name: '_addr', type: 'address' }],
          name: 'unwhitelistBetaDelegate',
          outputs: [],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: true,
          inputs: [
            { name: '_owner', type: 'address' },
            { name: '_spender', type: 'address' },
          ],
          name: 'allowance',
          outputs: [{ name: '', type: 'uint256' }],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: false,
          inputs: [{ name: '_addr', type: 'address' }],
          name: 'wipeFrozenAddress',
          outputs: [],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          constant: true,
          inputs: [],
          name: 'EIP712_DOMAIN_HASH',
          outputs: [{ name: '', type: 'bytes32' }],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: true,
          inputs: [{ name: '_addr', type: 'address' }],
          name: 'isFrozen',
          outputs: [{ name: '', type: 'bool' }],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: true,
          inputs: [],
          name: 'supplyController',
          outputs: [{ name: '', type: 'address' }],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
        {
          constant: false,
          inputs: [],
          name: 'reclaimBUSD',
          outputs: [],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          inputs: [],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'constructor',
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, name: 'from', type: 'address' },
            { indexed: true, name: 'to', type: 'address' },
            { indexed: false, name: 'value', type: 'uint256' },
          ],
          name: 'Transfer',
          type: 'event',
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, name: 'owner', type: 'address' },
            { indexed: true, name: 'spender', type: 'address' },
            { indexed: false, name: 'value', type: 'uint256' },
          ],
          name: 'Approval',
          type: 'event',
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, name: 'currentOwner', type: 'address' },
            { indexed: true, name: 'proposedOwner', type: 'address' },
          ],
          name: 'OwnershipTransferProposed',
          type: 'event',
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, name: 'oldProposedOwner', type: 'address' },
          ],
          name: 'OwnershipTransferDisregarded',
          type: 'event',
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, name: 'oldOwner', type: 'address' },
            { indexed: true, name: 'newOwner', type: 'address' },
          ],
          name: 'OwnershipTransferred',
          type: 'event',
        },
        { anonymous: false, inputs: [], name: 'Pause', type: 'event' },
        { anonymous: false, inputs: [], name: 'Unpause', type: 'event' },
        {
          anonymous: false,
          inputs: [{ indexed: true, name: 'addr', type: 'address' }],
          name: 'AddressFrozen',
          type: 'event',
        },
        {
          anonymous: false,
          inputs: [{ indexed: true, name: 'addr', type: 'address' }],
          name: 'AddressUnfrozen',
          type: 'event',
        },
        {
          anonymous: false,
          inputs: [{ indexed: true, name: 'addr', type: 'address' }],
          name: 'FrozenAddressWiped',
          type: 'event',
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              name: 'oldAssetProtectionRole',
              type: 'address',
            },
            {
              indexed: true,
              name: 'newAssetProtectionRole',
              type: 'address',
            },
          ],
          name: 'AssetProtectionRoleSet',
          type: 'event',
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, name: 'to', type: 'address' },
            { indexed: false, name: 'value', type: 'uint256' },
          ],
          name: 'SupplyIncreased',
          type: 'event',
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, name: 'from', type: 'address' },
            { indexed: false, name: 'value', type: 'uint256' },
          ],
          name: 'SupplyDecreased',
          type: 'event',
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, name: 'oldSupplyController', type: 'address' },
            { indexed: true, name: 'newSupplyController', type: 'address' },
          ],
          name: 'SupplyControllerSet',
          type: 'event',
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, name: 'from', type: 'address' },
            { indexed: true, name: 'to', type: 'address' },
            { indexed: false, name: 'value', type: 'uint256' },
            { indexed: false, name: 'seq', type: 'uint256' },
            { indexed: false, name: 'fee', type: 'uint256' },
          ],
          name: 'BetaDelegatedTransfer',
          type: 'event',
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, name: 'oldWhitelister', type: 'address' },
            { indexed: true, name: 'newWhitelister', type: 'address' },
          ],
          name: 'BetaDelegateWhitelisterSet',
          type: 'event',
        },
        {
          anonymous: false,
          inputs: [{ indexed: true, name: 'newDelegate', type: 'address' }],
          name: 'BetaDelegateWhitelisted',
          type: 'event',
        },
        {
          anonymous: false,
          inputs: [{ indexed: true, name: 'oldDelegate', type: 'address' }],
          name: 'BetaDelegateUnwhitelisted',
          type: 'event',
        },
      ];
    }
    if (coin == 'DRNH') {
      tokenAddress = '0x8B76AdD310295D74855FA55c62AaFB92623450Fa';
      abi = [
        { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: 'address',
              name: 'owner',
              type: 'address',
            },
            {
              indexed: true,
              internalType: 'address',
              name: 'spender',
              type: 'address',
            },
            {
              indexed: false,
              internalType: 'uint256',
              name: 'value',
              type: 'uint256',
            },
          ],
          name: 'Approval',
          type: 'event',
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: 'address',
              name: 'from',
              type: 'address',
            },
            {
              indexed: true,
              internalType: 'address',
              name: 'to',
              type: 'address',
            },
            {
              indexed: false,
              internalType: 'uint256',
              name: 'value',
              type: 'uint256',
            },
          ],
          name: 'Transfer',
          type: 'event',
        },
        {
          inputs: [
            { internalType: 'address', name: 'owner', type: 'address' },
            { internalType: 'address', name: 'spender', type: 'address' },
          ],
          name: 'allowance',
          outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            { internalType: 'address', name: 'spender', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
          ],
          name: 'approve',
          outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          inputs: [
            { internalType: 'address', name: 'account', type: 'address' },
          ],
          name: 'balanceOf',
          outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
          ],
          name: 'burn',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          inputs: [],
          name: 'decimals',
          outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            { internalType: 'address', name: 'spender', type: 'address' },
            {
              internalType: 'uint256',
              name: 'subtractedValue',
              type: 'uint256',
            },
          ],
          name: 'decreaseAllowance',
          outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          inputs: [
            { internalType: 'address', name: 'spender', type: 'address' },
            { internalType: 'uint256', name: 'addedValue', type: 'uint256' },
          ],
          name: 'increaseAllowance',
          outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          inputs: [],
          name: 'name',
          outputs: [{ internalType: 'string', name: '', type: 'string' }],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'symbol',
          outputs: [{ internalType: 'string', name: '', type: 'string' }],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'totalSupply',
          outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
          ],
          name: 'transfer',
          outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          inputs: [
            { internalType: 'address', name: 'from', type: 'address' },
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
          ],
          name: 'transferFrom',
          outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ];
    } else if (coin == 'USDT') {
      if (network == 'ERC20') {
        tokenAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
        abi = [
          {
            constant: true,
            inputs: [],
            name: 'name',
            outputs: [{ name: '', type: 'string' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: false,
            inputs: [{ name: '_upgradedAddress', type: 'address' }],
            name: 'deprecate',
            outputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { name: '_spender', type: 'address' },
              { name: '_value', type: 'uint256' },
            ],
            name: 'approve',
            outputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'deprecated',
            outputs: [{ name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: false,
            inputs: [{ name: '_evilUser', type: 'address' }],
            name: 'addBlackList',
            outputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'totalSupply',
            outputs: [{ name: '', type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { name: '_from', type: 'address' },
              { name: '_to', type: 'address' },
              { name: '_value', type: 'uint256' },
            ],
            name: 'transferFrom',
            outputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'upgradedAddress',
            outputs: [{ name: '', type: 'address' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [{ name: '', type: 'address' }],
            name: 'balances',
            outputs: [{ name: '', type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'decimals',
            outputs: [{ name: '', type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'maximumFee',
            outputs: [{ name: '', type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: '_totalSupply',
            outputs: [{ name: '', type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: false,
            inputs: [],
            name: 'unpause',
            outputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: true,
            inputs: [{ name: '_maker', type: 'address' }],
            name: 'getBlackListStatus',
            outputs: [{ name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [
              { name: '', type: 'address' },
              { name: '', type: 'address' },
            ],
            name: 'allowed',
            outputs: [{ name: '', type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'paused',
            outputs: [{ name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [{ name: 'who', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: '', type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: false,
            inputs: [],
            name: 'pause',
            outputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'getOwner',
            outputs: [{ name: '', type: 'address' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'owner',
            outputs: [{ name: '', type: 'address' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'symbol',
            outputs: [{ name: '', type: 'string' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { name: '_to', type: 'address' },
              { name: '_value', type: 'uint256' },
            ],
            name: 'transfer',
            outputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { name: 'newBasisPoints', type: 'uint256' },
              { name: 'newMaxFee', type: 'uint256' },
            ],
            name: 'setParams',
            outputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: false,
            inputs: [{ name: 'amount', type: 'uint256' }],
            name: 'issue',
            outputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: false,
            inputs: [{ name: 'amount', type: 'uint256' }],
            name: 'redeem',
            outputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: true,
            inputs: [
              { name: '_owner', type: 'address' },
              { name: '_spender', type: 'address' },
            ],
            name: 'allowance',
            outputs: [{ name: 'remaining', type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'basisPointsRate',
            outputs: [{ name: '', type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [{ name: '', type: 'address' }],
            name: 'isBlackListed',
            outputs: [{ name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: false,
            inputs: [{ name: '_clearedUser', type: 'address' }],
            name: 'removeBlackList',
            outputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'MAX_UINT',
            outputs: [{ name: '', type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: false,
            inputs: [{ name: 'newOwner', type: 'address' }],
            name: 'transferOwnership',
            outputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: false,
            inputs: [{ name: '_blackListedUser', type: 'address' }],
            name: 'destroyBlackFunds',
            outputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              { name: '_initialSupply', type: 'uint256' },
              { name: '_name', type: 'string' },
              { name: '_symbol', type: 'string' },
              { name: '_decimals', type: 'uint256' },
            ],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'constructor',
          },
          {
            anonymous: false,
            inputs: [{ indexed: false, name: 'amount', type: 'uint256' }],
            name: 'Issue',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [{ indexed: false, name: 'amount', type: 'uint256' }],
            name: 'Redeem',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [{ indexed: false, name: 'newAddress', type: 'address' }],
            name: 'Deprecate',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              { indexed: false, name: 'feeBasisPoints', type: 'uint256' },
              { indexed: false, name: 'maxFee', type: 'uint256' },
            ],
            name: 'Params',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              { indexed: false, name: '_blackListedUser', type: 'address' },
              { indexed: false, name: '_balance', type: 'uint256' },
            ],
            name: 'DestroyedBlackFunds',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [{ indexed: false, name: '_user', type: 'address' }],
            name: 'AddedBlackList',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [{ indexed: false, name: '_user', type: 'address' }],
            name: 'RemovedBlackList',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              { indexed: true, name: 'owner', type: 'address' },
              { indexed: true, name: 'spender', type: 'address' },
              { indexed: false, name: 'value', type: 'uint256' },
            ],
            name: 'Approval',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              { indexed: true, name: 'from', type: 'address' },
              { indexed: true, name: 'to', type: 'address' },
              { indexed: false, name: 'value', type: 'uint256' },
            ],
            name: 'Transfer',
            type: 'event',
          },
          { anonymous: false, inputs: [], name: 'Pause', type: 'event' },
          { anonymous: false, inputs: [], name: 'Unpause', type: 'event' },
        ];
      } else {
        tokenAddress = '0x55d398326f99059fF775485246999027B3197955';
        abi = [
          {
            inputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'constructor',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'owner',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'address',
                name: 'spender',
                type: 'address',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'value',
                type: 'uint256',
              },
            ],
            name: 'Approval',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'previousOwner',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
              },
            ],
            name: 'OwnershipTransferred',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'from',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'address',
                name: 'to',
                type: 'address',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'value',
                type: 'uint256',
              },
            ],
            name: 'Transfer',
            type: 'event',
          },
          {
            constant: true,
            inputs: [],
            name: '_decimals',
            outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: '_name',
            outputs: [{ internalType: 'string', name: '', type: 'string' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: '_symbol',
            outputs: [{ internalType: 'string', name: '', type: 'string' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [
              { internalType: 'address', name: 'owner', type: 'address' },
              { internalType: 'address', name: 'spender', type: 'address' },
            ],
            name: 'allowance',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { internalType: 'address', name: 'spender', type: 'address' },
              { internalType: 'uint256', name: 'amount', type: 'uint256' },
            ],
            name: 'approve',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: true,
            inputs: [
              { internalType: 'address', name: 'account', type: 'address' },
            ],
            name: 'balanceOf',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { internalType: 'uint256', name: 'amount', type: 'uint256' },
            ],
            name: 'burn',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'decimals',
            outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { internalType: 'address', name: 'spender', type: 'address' },
              {
                internalType: 'uint256',
                name: 'subtractedValue',
                type: 'uint256',
              },
            ],
            name: 'decreaseAllowance',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'getOwner',
            outputs: [{ internalType: 'address', name: '', type: 'address' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { internalType: 'address', name: 'spender', type: 'address' },
              { internalType: 'uint256', name: 'addedValue', type: 'uint256' },
            ],
            name: 'increaseAllowance',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { internalType: 'uint256', name: 'amount', type: 'uint256' },
            ],
            name: 'mint',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'name',
            outputs: [{ internalType: 'string', name: '', type: 'string' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'owner',
            outputs: [{ internalType: 'address', name: '', type: 'address' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: false,
            inputs: [],
            name: 'renounceOwnership',
            outputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'symbol',
            outputs: [{ internalType: 'string', name: '', type: 'string' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'totalSupply',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { internalType: 'address', name: 'recipient', type: 'address' },
              { internalType: 'uint256', name: 'amount', type: 'uint256' },
            ],
            name: 'transfer',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { internalType: 'address', name: 'sender', type: 'address' },
              { internalType: 'address', name: 'recipient', type: 'address' },
              { internalType: 'uint256', name: 'amount', type: 'uint256' },
            ],
            name: 'transferFrom',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { internalType: 'address', name: 'newOwner', type: 'address' },
            ],
            name: 'transferOwnership',
            outputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ];
      }
    } else if (coin == 'BTC') {
      if (network == 'BEP20') {
        tokenAddress =
          '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c'; /***BTCBtoken */
        abi = [
          {
            inputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'constructor',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'owner',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'address',
                name: 'spender',
                type: 'address',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'value',
                type: 'uint256',
              },
            ],
            name: 'Approval',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'previousOwner',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
              },
            ],
            name: 'OwnershipTransferred',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'from',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'address',
                name: 'to',
                type: 'address',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'value',
                type: 'uint256',
              },
            ],
            name: 'Transfer',
            type: 'event',
          },
          {
            constant: true,
            inputs: [],
            name: '_decimals',
            outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: '_name',
            outputs: [{ internalType: 'string', name: '', type: 'string' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: '_symbol',
            outputs: [{ internalType: 'string', name: '', type: 'string' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [
              { internalType: 'address', name: 'owner', type: 'address' },
              { internalType: 'address', name: 'spender', type: 'address' },
            ],
            name: 'allowance',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { internalType: 'address', name: 'spender', type: 'address' },
              { internalType: 'uint256', name: 'amount', type: 'uint256' },
            ],
            name: 'approve',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: true,
            inputs: [
              { internalType: 'address', name: 'account', type: 'address' },
            ],
            name: 'balanceOf',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { internalType: 'uint256', name: 'amount', type: 'uint256' },
            ],
            name: 'burn',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'decimals',
            outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { internalType: 'address', name: 'spender', type: 'address' },
              {
                internalType: 'uint256',
                name: 'subtractedValue',
                type: 'uint256',
              },
            ],
            name: 'decreaseAllowance',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'getOwner',
            outputs: [{ internalType: 'address', name: '', type: 'address' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { internalType: 'address', name: 'spender', type: 'address' },
              {
                internalType: 'uint256',
                name: 'addedValue',
                type: 'uint256',
              },
            ],
            name: 'increaseAllowance',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { internalType: 'uint256', name: 'amount', type: 'uint256' },
            ],
            name: 'mint',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'name',
            outputs: [{ internalType: 'string', name: '', type: 'string' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'owner',
            outputs: [{ internalType: 'address', name: '', type: 'address' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: false,
            inputs: [],
            name: 'renounceOwnership',
            outputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'symbol',
            outputs: [{ internalType: 'string', name: '', type: 'string' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: true,
            inputs: [],
            name: 'totalSupply',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { internalType: 'address', name: 'recipient', type: 'address' },
              { internalType: 'uint256', name: 'amount', type: 'uint256' },
            ],
            name: 'transfer',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { internalType: 'address', name: 'sender', type: 'address' },
              { internalType: 'address', name: 'recipient', type: 'address' },
              { internalType: 'uint256', name: 'amount', type: 'uint256' },
            ],
            name: 'transferFrom',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { internalType: 'address', name: 'newOwner', type: 'address' },
            ],
            name: 'transferOwnership',
            outputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ];
      }
    }
    return [tokenAddress, abi];
  }

  async getBeaconTransactionStatus(transactionHash, apiurl) {
    try {
      const response = await this.httpService.axiosRef.get(
        `${apiurl}/api/v1/tx/${transactionHash}`,
      );

      console.log('sgas', response.data);
      const statusCode = response.data.code;
      if (statusCode === 0)
        return { success: true, message: 'Transferd successfully' };
      else return { success: false, message: 'Transferd failed' };
    } catch (error) {
      return await this.getBeaconTransactionStatus(transactionHash, apiurl);
    }
  }
  async transferBNBBep2(amount1, to_address, privateKey, memo): Promise<any> {
    const testnetapiurl = 'https://testnet-dex-asiapacific.binance.org';
    const mainnetapiurl = 'https://dex-asiapacific.binance.org';
    const clienturl = 'https://testnet-dex.binance.org';

    const network = 'testnet'; /*mainet*/
    const apiurl = testnetapiurl;
    //exlorer https://testnet-explorer.binance.org/tx/05077CF1B3A75F7A24462E7859A735B06A2B3D29CC1A34037353C456CEE68230
    //to track transactions at address
    //use api https://testnet-api.binance.org/bc/api/v1/txs?address=tbnb1ezt8yhmwp6vpl33kze9tpqz8yce20fc99lcmhl&startTime=1687458600000&endTime=1687585036378

    const client = new BncClient(clienturl);
    client.setPrivateKey(privateKey);
    client.chooseNetwork(network);
    await client.initChain();
    const fromAddress = client.getClientKeyAddress();
    let balance = await client.getBalance(fromAddress);

    if (balance[0].free < amount1) {
      return {
        success: false,
        message: 'Insufficient amount in wallet to withdraw',
      };
    }
    console.log('address', fromAddress);
    // to_address = 'tbnb1ezt8yhmwp6vpl33kze9tpqz8yce20fc99lcmhl';
    // let fromAddress = 'tbnb16954vyapy9v7x5uftsaen3c3hyaxfzsdcs9ccp';
    const sequenceURL = `${apiurl}/api/v1/account/${fromAddress}/sequence`;
    let sequence = 0;
    try {
      // Get the sequence number
      let res = await this.httpService.axiosRef.get(sequenceURL);
      sequence = res.data.sequence;
    } catch (err) {
      sequence = 0;
    }
    try {
      let result = await client.transfer(
        fromAddress,
        to_address,
        amount1,
        'BNB',
        memo,
        sequence,
      );
      console.log('result', result);
      // return await this.getBeaconTransactionStatus(
      //   result.result[0].hash,
      //   apiurl,
      // );
      if (result.result[0].hash !== undefined) {
        return {
          success: true,
          message: 'Transferd successfully',
          hash: result.result[0].hash,
        };
      } else {
        return {
          success: false,
          message: 'Transferd failed',
          hash: null,
        };
      }
    } catch (err) {
      return { success: false, message: 'Transferd failed with error ' + err };
    }
  }
  @Post('transfer_usdt')
  async usdt_transfer(
    @Body() post: UsdtTransferDto,
  ): Promise<WithdrawlResponse> {
    console.log('withdrww', post);
    const pk =
      '4557a58c97821a47ad27dafad3dc99a535bf85d1238174d9cb21243f392ea7a0';
    try {
      const amount1 = post['amount'].toString();
      //const to_address = '0xe62f6736B58A3Bd38ec2B340Deff6a99Ea447be5';
      const to_address = post['address'];
      const fromAddress = new ethers.Wallet(pk).address;
      const [tokenContract, abi] = this.getABiAndTokenContract('USDT', 'BEP20');

      const provider = new ethers.providers.JsonRpcProvider(
        this.current_bsc_url,
      );
      //const gasPrice = (await provider.getFeeData()).gasPrice;
      let signer = new ethers.Wallet(pk, provider);
      const contract = new ethers.Contract(tokenContract, abi, signer);

      let bal = await contract.functions.balanceOf(fromAddress);
      console.log('bal', bal);
      let weiBalanceBigNumber = BigInt(bal[0]._hex).toString();
      let balanceInSymobl = ethers.utils.formatEther(weiBalanceBigNumber);
      console.log('balance in symbol', balanceInSymobl);
      let amount = ethers.utils.parseUnits(amount1, 18);

      if (Number(balanceInSymobl) < Number(amount1)) {
        return {
          success: false,
          message: 'Insufficient Admin Amount',
          hash: '',
        };
      }

      let tx = await contract.transfer(
        to_address,
        amount,
        this.bscTransactionOption,
      );
      let g = await tx.wait();
      console.log('rece', g);
      return {
        success: true,
        message: 'usdt transfreed succsfully',
        hash: g.transactionHash,
        blockHash: g.blockHash,
      };
    } catch (error: any) {
      return { success: false, message: 'Transfer Failed ' + error };
    }
  }
  @Get('getBlockNumber')
  async get_block_number(): Promise<any> {
    
    try {
     
      
      
      const provider = new ethers.providers.JsonRpcProvider(
        this.current_bsc_url,
      );
     

      const blockn=await provider.getBlockNumber()
      
      return {
        success: true,
        message: 'got block number',
        data: blockn,
      };
    } catch (error: any) {
      return { success: false, message: 'Failed Reriving block ' + error };
    }
  }
  @Post('check_usdt_balance')
  async usdt_balance_check(
    @Body() post: Record<string,any>,
  ): Promise<any> {
    
    try {
     
      //const to_address = '0xe62f6736B58A3Bd38ec2B340Deff6a99Ea447be5';
      const address = post['address'];
     
      const [tokenContract, abi] = this.getABiAndTokenContract('USDT', 'BEP20');

      const provider = new ethers.providers.JsonRpcProvider(
        this.current_bsc_url,
      );
     
      const contract = new ethers.Contract(tokenContract, abi, provider);

      let bal = await contract.functions.balanceOf(address);
      console.log('bal', bal);
      let weiBalanceBigNumber = BigInt(bal[0]._hex).toString();
      let balanceInSymobl = ethers.utils.formatEther(weiBalanceBigNumber);
      console.log('balance in symbol', balanceInSymobl);
      
      return {
        success: true,
        message: 'usdt transfreed succsfully',
        data: balanceInSymobl,
      };
    } catch (error: any) {
      return { success: false, message: 'Transfer Failed ' + error };
    }
  }
  @Post('generate_wallet_address')
  async generate_wallet_address(
    @Body() post:Record<string,any>,
  ): Promise<{ address: string; privateKey: string }> {
    const privateKey = CryptoAccount.newPrivateKey();

    let network = post['network'];
    let account = null;
    if (network == 'Bitcoin') {
      account = new CryptoAccount(privateKey, { network });
      return { address: await account.address('BTC'), privateKey: privateKey };
    } else if (
      network == 'BEP20' ||
      network == 'ERC20' ||
      network == 'Ethereum'
    ) {
      let id = crypto.randomBytes(32).toString('hex');
      let privateKey = '0x' + id;
      var wallet = new ethers.Wallet(privateKey);
      console.log('Address: ' + wallet.address);
      return { address: wallet.address, privateKey: id };
    } else if (network == 'BEP2') return this.getBnbAddress();
  }
}
