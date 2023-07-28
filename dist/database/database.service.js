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
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const trade_entity_1 = require("./trade/trade.entity");
const order_book_entity_1 = require("./order_book/order_book.entity");
const wallet_entity_1 = require("./wallet/wallet.entity");
const network_fees_entity_1 = require("./network_fees/network_fees.entity");
const withdrawal_entity_1 = require("./withdrawal_entity/withdrawal.entity");
const schedule_1 = require("@nestjs/schedule");
const error_handling_entity_1 = require("./error_handling.entity");
const deposit_entity_1 = require("./deposit_entity/deposit.entity");
const user_entity_1 = require("./user/user.entity");
const address_balance_entity_1 = require("./address_balance.entity");
const uuid_1 = require("uuid");
const bcrypt = require("bcrypt");
const identity_entity_1 = require("./identity/identity.entity");
let DatabaseService = class DatabaseService {
    constructor(tradeRepository, bookRepository, walletRepository, errorRepository, depositRepository, userRepository, tokenAddressBalanceRepository, withdrawalRepository, nwFeesRepository, identityRepository, manager, schedulerRegistry, dataSource) {
        this.tradeRepository = tradeRepository;
        this.bookRepository = bookRepository;
        this.walletRepository = walletRepository;
        this.errorRepository = errorRepository;
        this.depositRepository = depositRepository;
        this.userRepository = userRepository;
        this.tokenAddressBalanceRepository = tokenAddressBalanceRepository;
        this.withdrawalRepository = withdrawalRepository;
        this.nwFeesRepository = nwFeesRepository;
        this.identityRepository = identityRepository;
        this.manager = manager;
        this.schedulerRegistry = schedulerRegistry;
        this.dataSource = dataSource;
    }
    async getAllTrades(symbol, limit) {
        return await this.tradeRepository.find({
            where: { symbol },
            take: limit,
            order: {
                created_at: 'DESC',
            },
        });
    }
    async getUserTrades(user_id, symbol, limit) {
        const list = await this.dataSource.query(`SELECT * FROM tbl_trades WHERE \`symbol\` ='${symbol}' AND (\`buyer_id\`=${user_id} OR \`seller_id\`=${user_id})`);
        return JSON.parse(JSON.stringify(list));
    }
    async getPendingWithdrawal() {
        return await this.withdrawalRepository.find({
            select: {
                transaction_hash: true,
                user_id: true,
                from_address: true,
                to_address: true,
                id: true,
                created_at: true,
                coin: true,
            },
            where: {
                network: (0, typeorm_2.Raw)((alias) => `${alias} !='Bitcoin'`),
                status: withdrawal_entity_1.Status.Pending,
                deleted: user_entity_1.YesNo.NO,
                pay_by_admin: user_entity_1.YesNo.NO,
                created_at: (0, typeorm_2.Raw)((alias) => `${alias} > NOW() - interval 6 hour`),
            },
        });
    }
    async getPendingDeposits() {
        return await this.depositRepository.find({
            select: {
                user_id: true,
                to_address: true,
                start_block: true,
                id: true,
                created_at: true,
                coin: true,
            },
            where: {
                network: (0, typeorm_2.Raw)((alias) => `${alias} !='Bitcoin'`),
                status: withdrawal_entity_1.Status.Pending,
                deleted: user_entity_1.YesNo.NO,
                created_at: (0, typeorm_2.Raw)((alias) => `${alias} > NOW() - interval 6 hour`),
            },
        });
    }
    async getAllOrders(user_id, symbol, side, limit = 100) {
        return await this.bookRepository.find({
            where: { side: side, symbol: symbol, is_filled: false, uid: user_id },
            take: limit,
            order: {
                price: side == 'BUY' ? 'ASC' : 'DESC',
                created_at: 'DESC',
            },
        });
    }
    async getOrderById(id) {
        return await this.bookRepository.findOne({ where: { id } });
    }
    async fetchAllOrdersByUserId(userid) {
        console.log('got ui');
        return await this.bookRepository.find({ where: { uid: userid } });
    }
    async getUserOrders(user_id, symbol, side, limit = 100) {
        return await this.bookRepository.find({
            where: { side: side, symbol: symbol, is_filled: false, uid: user_id },
            take: limit,
            order: {
                created_at: 'DESC',
            },
        });
    }
    async getUserOrdersNoSide(user_id, symbol, limit = 100) {
        return await this.bookRepository.find({
            where: { symbol: symbol, is_filled: false, uid: user_id },
            take: limit,
            order: {
                created_at: 'DESC',
            },
        });
    }
    async findOrders(side, symbol, limit, order_by) {
        let g = await this.bookRepository.find({
            where: { side: side, symbol: symbol, is_filled: false },
            order: {
                price: order_by,
                created_at: 'ASC',
            },
            take: limit,
        });
        return g;
    }
    async saveTrade(trade) {
        trade.volume = trade.price * trade.size;
        return await this.tradeRepository.save(trade);
    }
    async saveError(error) {
        return await this.errorRepository.save(error);
    }
    async saveOrderBook(order_book) {
        order_book.is_filled = false;
        return await this.bookRepository.save(order_book);
    }
    async updateOrderBook(id, update) {
        return await this.bookRepository.update({ id: id }, update);
    }
    async setCurrentRefreshToken(refreshToken, id) {
        const salt = await bcrypt.genSalt();
        refreshToken = await bcrypt.hash(refreshToken, salt);
        return await this.userRepository.update({ id: id }, { refreshToken });
    }
    async last_24_hours_data() {
        let result = await this.manager.query('select SUM(`size`) as coin1_volume,SUM(`volume`) as coin2_volume,MIN(`price`) as low,MAX(`price`) as high from tbl_trades where HOUR(TIMEDIFF(now(), `created_at`))<=24');
        let y = result.map((v) => {
            return JSON.parse(JSON.stringify(v));
        });
        return y[0];
    }
    async price_before_24_hour() {
        const last_price_before_24 = await this.manager.query('select `price` from tbl_trades where HOUR(TIMEDIFF(now(), `created_at`))>24  ORDER BY `created_at` DESC LIMIT 1');
        return last_price_before_24[0] !== undefined
            ? last_price_before_24[0].price
            : 0;
    }
    async getNetworkFees(network) {
        let g = await this.nwFeesRepository.findOne({ where: { network } });
        return g;
    }
    async searchAddress(user_id, network) {
        let g = await this.walletRepository.find({
            where: { network: network, user_id: user_id },
        });
        return g.length > 0 ? g[0] : null;
    }
    async todayWithrawn(user_id, coin, network) {
        let g = await this.withdrawalRepository
            .createQueryBuilder('tbl_withdrawal')
            .select('SUM(tbl_withdrawal.with_amount)', 'totalAmount')
            .where('tbl_withdrawal.coin = :coin', { coin: coin })
            .where('tbl_withdrawal.network = :network', { network: network })
            .where('tbl_withdrawal.user_id = :user_id', { user_id: user_id })
            .where('DATE(tbl_withdrawal.created_at) =DATE(NOW())')
            .getRawOne();
        let j = JSON.parse(JSON.stringify(g));
        return j.totalAmount;
    }
    async saveAddress(user_id, network, address, privateKey) {
        let new_wallet = {
            user_id: user_id,
            network,
            deposit_address: address,
            privateKey: privateKey,
        };
        return await this.walletRepository.save(new_wallet);
    }
    async saveWithdrawal(user_id, from_address, to_address, coin, network, with_amount, transaction_hash, status = withdrawal_entity_1.Status.Pending, pay_with_admin = user_entity_1.YesNo.NO) {
        let obj = {
            user_id,
            from_address,
            to_address,
            coin,
            network,
            with_amount,
            transaction_hash,
            status,
        };
        await this.withdrawalRepository.save(obj);
        if (network != 'Bitcoin') {
            const job = this.schedulerRegistry.getCronJob('withdrawal_cron');
            job.start();
        }
        return;
    }
    async saveDeposit(user_id, address, coin, network, start_block) {
        let obj = {
            user_id,
            to_address: address,
            coin,
            network,
            start_block,
        };
        await this.depositRepository.save(obj);
        if (network != 'Bitcoin') {
            const job = this.schedulerRegistry.getCronJob('deposit_cron');
            job.start();
        }
        return;
    }
    async updateWebhookId(transaction_hash, hook_id, to, coin, network) {
        let g;
        if (hook_id !== undefined) {
            g = await this.withdrawalRepository.update({ coin, network, transaction_hash, to_address: to }, { webhook_id: hook_id });
        }
        return g;
    }
    async updateWtihdrawalStatus(transaction_hash, status) {
        await this.withdrawalRepository.update({ transaction_hash }, { status: status });
        if (status == withdrawal_entity_1.Status.Approved) {
            let with_info = await this.withdrawalRepository.findOne({
                where: { transaction_hash },
            });
            if (with_info) {
                await this.walletRepository.decrement({
                    user_id: with_info['user_id'],
                    network: with_info.network,
                }, 'balance', with_info['with_amount']);
            }
        }
        return;
    }
    async updateWtihdrawalById(id, data) {
        await this.withdrawalRepository.update({ id }, data);
        return;
    }
    async updateDepositById(id, data) {
        await this.depositRepository.update({ id }, data);
        return;
    }
    async updateWallet(user_id, amount, from_address, coin, network, toDo) {
        let balance_column = coin.toLowerCase() + '_balance';
        let setString = toDo == 'Inc'
            ? `${balance_column} +${amount}`
            : `${balance_column} -${amount}`;
        if (toDo == 'Inc') {
            await this.walletRepository.increment({
                user_id: user_id,
                network: network,
                deposit_address: from_address,
            }, balance_column, amount);
        }
        else {
            await this.walletRepository.decrement({
                user_id: user_id,
                network: network,
                deposit_address: from_address,
            }, balance_column, amount);
        }
        return;
    }
    async checkForPendingDeposit(user_id, coin, network, to_address) {
        let c = await this.depositRepository.findOne({
            where: { user_id, coin, network, deleted: user_entity_1.YesNo.NO, to_address },
        });
        if (c)
            return true;
        else
            return false;
    }
    async findDbWithdrawalSourceAddress(coin, network, amount) {
        let c = await this.tokenAddressBalanceRepository.findBy({
            coin: (0, typeorm_2.Equal)(coin),
            network: (0, typeorm_2.Equal)(network),
            balance: (0, typeorm_2.MoreThanOrEqual)(amount),
        });
        if (c.length > 0)
            return c[0];
        else
            return false;
    }
    async updateTokenAddressBalance(id, amount, todo) {
        return todo == 'Inc'
            ? await this.tokenAddressBalanceRepository.increment({ id: id }, 'balance', amount)
            : await this.tokenAddressBalanceRepository.decrement({ id: id }, 'balance', amount);
    }
    async saveTokenAddressBalance(address, coin, network, amount, todo = 'Inc') {
        let obj = {
            address,
            coin,
            network,
        };
        console.log('saving token adress balance', obj);
        let find = await this.tokenAddressBalanceRepository.findOne({
            where: { address, coin, network },
        });
        if (find !== undefined || find) {
            let v = todo == 'Inc'
                ? await this.tokenAddressBalanceRepository.increment(obj, 'balance', amount)
                : await this.tokenAddressBalanceRepository.decrement(obj, 'balance', amount);
        }
        else {
            await this.tokenAddressBalanceRepository.save({
                address,
                coin,
                network,
                balance: amount,
            });
        }
    }
    async findUser(email) {
        return await this.userRepository.findOne({
            where: { email },
        });
    }
    async findUserById(id) {
        return await this.userRepository.findOne({
            where: { id },
        });
    }
    async saveUser(user) {
        const salt = await bcrypt.genSalt();
        user.zasper_id = user.password;
        user.uuid = (0, uuid_1.v4)();
        user.password = await bcrypt.hash(user.password, salt);
        return await this.userRepository.save(user);
    }
    async removeRefreshToken(userId) {
        return await this.userRepository.update(userId, {
            refreshToken: null,
        });
    }
    async updateUser(uuid, data) {
        return await this.userRepository.update({ uuid: uuid }, data);
    }
    async updateUserById(id, data) {
        return await this.userRepository.update({ id: id }, data);
    }
    async existUserData(data) {
        return await this.userRepository.findOne({ where: data });
    }
    async updateIdentity(data) {
        const exist = await this.identityRepository.findOne({
            where: { user_id: data.user_id },
        });
        let q = null;
        if (!exist)
            await this.identityRepository.insert(data);
        else
            await this.identityRepository.update({ user_id: data.user_id }, data);
        return;
    }
    async lastUpdatedTimeListener() {
        const rawData = await this.dataSource.query('SELECT * FROM  listner_updated');
        let g = JSON.parse(JSON.stringify(rawData));
        return g[0]['updated_at'];
    }
    async updateListenerTime() {
        let d = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const rawData = await this.dataSource.query(`UPDATE  listner_updated SET updated_at='${d}'`);
        return;
    }
    async insertInBinanceTradeTablensertInB(user_id, clientOrderId, price, oQty, exQty, side, type, status, fills, symbol, orderId, cummulativeQuoteQty, settled_price) {
        let time = new Date().toISOString().slice(0, 19).replace('T', ' ');
        let q = "INSERT INTO binance_trade (`user_id`,`clientOrderId`, `price`, `origQty`,`executedQty`,`status`,`type`,`side`,`fills`,`created_at`,`symbol`,`orderId`,`cummulativeQuoteQty`,`settled_price`) VALUES ('" +
            user_id +
            "', '" +
            clientOrderId +
            "', '" +
            price +
            "', '" +
            oQty +
            "', '" +
            exQty +
            "', '" +
            status +
            "', '" +
            type +
            "', '" +
            side +
            "', '" +
            fills +
            "','" +
            time +
            "','" +
            symbol +
            "','" +
            orderId +
            "','" +
            cummulativeQuoteQty +
            "','" +
            settled_price +
            "')";
        const rawData = await this.dataSource.query(q);
        return;
    }
    async updateBinanceTrade(clientOrderId, side, type, newStatus, symbol, orderId, date, execQty, settled_price) {
        let d = new Date(date).toISOString().slice(0, 19).replace('T', ' ');
        let q = `UPDATE  binance_trade SET \`status\`='${newStatus}',\`updated_at\`='${d}',\`executedQty\`='${execQty}'\`settled_price\`='${settled_price}' WHERE 
   \`clientOrderId\`='${clientOrderId}' AND \`orderId\`='${orderId}' AND \`side\`='${side}'
    AND \`type\`='${type}' AND \`symbol\`='${symbol}' `;
        const rawData = await this.dataSource.query(q);
        return;
    }
    async updateWalletQuery(q) {
        const rawData = await this.dataSource.query(q);
        return;
    }
    async insertEventData(clientOrderId, event_date, full_event_data) {
        let time = new Date().toISOString().slice(0, 19).replace('T', ' ');
        let q = `INSERT INTO trade_event (\`clientOrderId\`, \`event\`, \`full_event\`) VALUES ('${clientOrderId}','${JSON.stringify(event_date)}','${JSON.stringify(full_event_data)}')`;
        await this.dataSource.query(q);
        return;
    }
    async getOrderFromTable(orderId, user_id) {
        const rawData = await this.dataSource.query(`SELECT * FROM  binance_trade WHERE \`orderId\`='${orderId}' AND \`user_id\`='${user_id}' AND DATE(\`created_at\`)=DATE(NOW())`);
        let g = JSON.parse(JSON.stringify(rawData));
        return g[0] !== undefined || g[0] != null ? g[0] : null;
    }
    async getAllUserOrderFromTable(user_id) {
        const rawData = await this.dataSource.query(`SELECT * FROM  binance_trade WHERE  \`user_id\`='${user_id}'`);
        let g = JSON.stringify(rawData);
        return g;
    }
    async deleteOrder(orderId, user_id) {
        const rawData = await this.dataSource.query(`DELETE FROM  binance_trade WHERE \`orderId\`='${orderId}' AND \`user_id\`='${user_id}'`);
        console.log('delete order in service db');
        return;
    }
};
DatabaseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(trade_entity_1.Trade)),
    __param(1, (0, typeorm_1.InjectRepository)(order_book_entity_1.OrderBook)),
    __param(2, (0, typeorm_1.InjectRepository)(wallet_entity_1.Wallet)),
    __param(3, (0, typeorm_1.InjectRepository)(error_handling_entity_1.ErrorSave)),
    __param(4, (0, typeorm_1.InjectRepository)(deposit_entity_1.Deposit)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(6, (0, typeorm_1.InjectRepository)(address_balance_entity_1.TokenAddressBalance)),
    __param(7, (0, typeorm_1.InjectRepository)(withdrawal_entity_1.Withdrawal)),
    __param(8, (0, typeorm_1.InjectRepository)(network_fees_entity_1.NetworkFee)),
    __param(9, (0, typeorm_1.InjectRepository)(identity_entity_1.Identity)),
    __param(12, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.EntityManager,
        schedule_1.SchedulerRegistry,
        typeorm_2.DataSource])
], DatabaseService);
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=database.service.js.map