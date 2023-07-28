"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3Service = void 0;
const common_1 = require("@nestjs/common");
const web3_1 = require("web3");
const axios_1 = require("@nestjs/axios");
const database_service_1 = require("../database/database.service");
let Web3Service = class Web3Service {
    constructor(web3, ethWeb3, httpService, dbService) {
        this.web3 = web3;
        this.ethWeb3 = ethWeb3;
        this.httpService = httpService;
        this.dbService = dbService;
        this.ethConfirmationCountTarget = 12;
        this.bscConfirmationCountTarget = 4;
        console.log('i m calle');
    }
    async getCurrentBlock() {
        let blocknumber = this.web3.eth.getBlockNumber();
        return blocknumber;
    }
    async findTransactionForDeposit(address, amount, coin, network, blocknumber) {
        let bscscan_api_url = 'https://api-testnet.bscscan.com/api';
        let etherscan_api_url = 'https://api-testnet.etherscan.com/api';
        let url = network == 'BEP20' ? bscscan_api_url : etherscan_api_url;
        let apikey = 'UKHMWR7KTHCRJJVUFJTDUWRUYA2QXCC5MQ';
        let found_transaction = null;
        const targetCount = network == 'BEP20'
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
                tx_list.forEach(async (v) => {
                    try {
                        let decoded = this.web3.eth.abi.decodeParameters(erc20TransferABI, v.input.slice(10));
                        let deposit_amount = this.web3.utils.fromWei(decoded.amount.toString(), 'ether');
                        let receiver_address = decoded.to;
                        if (address == receiver_address &&
                            v.blockNumber > blocknumber &&
                            amount.toString() == deposit_amount) {
                            const confirmationCount = await this.getConfirmations(v.hash, network);
                            if (confirmationCount >= targetCount) {
                                v.input = decoded;
                                found_transaction = v;
                            }
                            else
                                found_transaction = confirmationCount;
                            return;
                        }
                    }
                    catch (err) {
                    }
                });
            }
        }
        catch (error) {
            await this.dbService.saveError({ error: error, from: `When searc hing deposit transaction status from ${address} of amount ${amount}` });
        }
        return found_transaction;
    }
    async testScanApi() {
        let timestamp = 1688453728;
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
                let decoded = this.web3.eth.abi.decodeParameters(erc20TransferABI, v.input.slice(10));
                v.input = decoded;
                return v;
            }
            catch (err) {
            }
        });
        console.log(list);
    }
    async receipt(hash, from_address, network) {
        let g = network == 'BEP20'
            ? await this.web3.eth.getTransactionReceipt(hash)
            : await this.ethWeb3.eth.getTransactionReceipt(hash);
        const targetCount = network == 'BEP20' ? this.bscConfirmationCountTarget : this.ethConfirmationCountTarget;
        const confirmationCount = await this.getConfirmations(g.transactionHash, network);
        if (g) {
            if (g.transactionHash == hash &&
                g.from.toLowerCase() == from_address.toLowerCase() && confirmationCount >= targetCount) {
                g.confirmationCount = confirmationCount;
                return g;
            }
        }
        else
            return confirmationCount;
    }
    async getConfirmations(txHash, network) {
        try {
            const web3 = network == 'BEP20' ? this.web3 : this.ethWeb3;
            const trx = await web3.eth.getTransaction(txHash);
            const currentBlock = await web3.eth.getBlockNumber();
            return trx.blockNumber === null ? 0 : currentBlock - BigInt(trx.blockNumber);
        }
        catch (error) {
            await this.dbService.saveError({ error: error, from: 'Get confirmations function ' });
        }
    }
};
Web3Service = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('Web3')),
    __param(1, (0, common_1.Inject)('EthWeb3')),
    __metadata("design:paramtypes", [web3_1.Web3,
        web3_1.Web3,
        axios_1.HttpService,
        database_service_1.DatabaseService])
], Web3Service);
exports.Web3Service = Web3Service;
//# sourceMappingURL=web3.service.js.map