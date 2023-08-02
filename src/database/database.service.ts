/* eslint-disable*/
import { Injectable, Inject } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Equal, MoreThanOrEqual, Raw, Repository } from 'typeorm';
import { Trade } from './trade/trade.entity';
import { OrderBook } from './order_book/order_book.entity';
import { Coin, Wallet } from './wallet/wallet.entity';
import { NetworkFee } from './network_fees/network_fees.entity';
import { Status, Withdrawal } from './withdrawal_entity/withdrawal.entity';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ErrorSave } from './error_handling.entity';
import { Deposit } from './deposit_entity/deposit.entity';
import { User, YesNo } from './user/user.entity';
import { TokenAddressBalance } from './address_balance.entity';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { Identity } from './identity/identity.entity';
@Injectable()
export class DatabaseService {
  constructor(
    @InjectRepository(Trade) private tradeRepository: Repository<Trade>,
    @InjectRepository(OrderBook) private bookRepository: Repository<OrderBook>,
    @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
    @InjectRepository(ErrorSave) private errorRepository: Repository<ErrorSave>,
    @InjectRepository(Deposit) private depositRepository: Repository<Deposit>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(TokenAddressBalance)
    private tokenAddressBalanceRepository: Repository<TokenAddressBalance>,
    @InjectRepository(Withdrawal)
    private withdrawalRepository: Repository<Withdrawal>,
    @InjectRepository(NetworkFee)
    private nwFeesRepository: Repository<NetworkFee>,
    @InjectRepository(Identity)
    private identityRepository: Repository<Identity>,
    private manager: EntityManager,
    private schedulerRegistry: SchedulerRegistry,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async getAllTrades(symbol, limit): Promise<Trade[]> {
    return await this.tradeRepository.find({
      where: { symbol },
      take: limit,
      order: {
        created_at: 'DESC',
      },
    });
  }
 
  async getUserTrades(user_id, symbol, limit): Promise<Trade[]> {
    const list = await this.dataSource.query(
      `SELECT * FROM tbl_trades WHERE \`symbol\` ='${symbol}' AND (\`buyer_id\`=${user_id} OR \`seller_id\`=${user_id})`,
    );

    return JSON.parse(JSON.stringify(list));
  }
  async getPendingWithdrawal(): Promise<Partial<Withdrawal>[]> {
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
        network: Raw((alias) => `${alias} !='Bitcoin'`),
        status: Status.Pending,
        deleted: YesNo.NO,
        pay_by_admin: YesNo.NO,
        created_at: Raw((alias) => `${alias} > NOW() - interval 6 hour`),
      },
    });
  }
  async getPendingDeposits(): Promise<Partial<Deposit>[]> {
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
        network: Raw((alias) => `${alias} !='Bitcoin'`),
        status: Status.Pending,
        deleted: YesNo.NO,
        created_at: Raw((alias) => `${alias} > NOW() - interval 6 hour`),
      },
    });
  }
  async getAllOrders(
    user_id: number,
    symbol: string,
    side: string,
    limit = 100,
  ): Promise<OrderBook[]> {
    return await this.bookRepository.find({
      where: { side: side, symbol: symbol, is_filled: false, uid: user_id },
      take: limit,
      order: {
        price: side == 'BUY' ? 'ASC' : 'DESC',
        created_at: 'DESC',
      },
    });
  }
  async getOrderById(
    id: number,
 
  ): Promise<OrderBook> {
    return await this.bookRepository.findOne({ where: { id } });
  }
  async fetchAllOrdersByUserId(
    userid: number,
 
  ): Promise<OrderBook[]> {
    console.log('got ui')
    return await this.bookRepository.find({ where: { uid:userid } });
  }
  async getUserOrders(
    user_id: number,
    symbol: string,
    side: string,
    limit = 100,
  ): Promise<OrderBook[]> {
    return await this.bookRepository.find({
      where: { side: side, symbol: symbol, is_filled: false, uid: user_id },
      take: limit,
      order: {
        created_at: 'DESC',
      },
    });
  }
  async getUserOrdersNoSide(
    user_id: number,
    symbol: string,

    limit = 100,
  ): Promise<OrderBook[]> {
    return await this.bookRepository.find({
      where: { symbol: symbol, is_filled: false, uid: user_id },
      take: limit,
      order: {
        created_at: 'DESC',
      },
    });
  }
  async findOrders(
    side: string,
    symbol: string,

    limit: number,
    order_by: any,
  ): Promise<OrderBook[]> {
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
  async saveTrade(trade: Trade): Promise<Trade> {
    trade.volume = trade.price * trade.size;

    return await this.tradeRepository.save(trade);
  }
  async saveError(error: ErrorSave): Promise<ErrorSave> {
    return await this.errorRepository.save(error);
  }
  async saveOrderBook(order_book: OrderBook): Promise<any> {
    order_book.is_filled = false;
    // order_book.volume = order_book.price * order_book.size;
    return await this.bookRepository.save(order_book);
  }
  async updateOrderBook(id: number, update): Promise<any> {
    return await this.bookRepository.update({ id: id }, update);
  }
  async setCurrentRefreshToken(refreshToken: string, id: number): Promise<any> {
    const salt = await bcrypt.genSalt();

    refreshToken = await bcrypt.hash(refreshToken, salt);
    return await this.userRepository.update({ id: id }, { refreshToken });
  }
  async last_24_hours_data(): Promise<any[]> {
    let result = await this.manager.query(
      'select SUM(`size`) as coin1_volume,SUM(`volume`) as coin2_volume,MIN(`price`) as low,MAX(`price`) as high from tbl_trades where HOUR(TIMEDIFF(now(), `created_at`))<=24',
    );
    let y = result.map((v) => {
      return JSON.parse(JSON.stringify(v));
    });
    return y[0];
  }
  async price_before_24_hour(): Promise<any> {
    const last_price_before_24 = await this.manager.query(
      'select `price` from tbl_trades where HOUR(TIMEDIFF(now(), `created_at`))>24  ORDER BY `created_at` DESC LIMIT 1',
    );

    return last_price_before_24[0] !== undefined
      ? last_price_before_24[0].price
      : 0;
  }
  async getNetworkFees(network: string): Promise<NetworkFee> {
    let g = await this.nwFeesRepository.findOne({ where: { network } });

    return g;
  }
  async searchAddress(
    user_id: number,

    network: string,
  ): Promise<Wallet> {
    let g = await this.walletRepository.find({
      where: { network: network, user_id: user_id },
    });

    return g.length > 0 ? (g[0] as Wallet) : null;
  }
  async todayWithrawn(
    user_id: number,
    coin: Coin,
    network: string,
  ): Promise<any> {
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
  async saveAddress(
    user_id: number,

    network: string,
    address: string,

    privateKey: string,
  ): Promise<Wallet> {
    let new_wallet = {
      user_id: user_id,
      network,
      deposit_address: address,
      privateKey: privateKey,
    };

    return await this.walletRepository.save(new_wallet);
  }
  async saveWithdrawal(
    user_id: number,
    from_address: string,
    to_address: string,
    coin: Coin,
    network: string,
    with_amount: number,
    transaction_hash: string,
    status: Status = Status.Pending,
    pay_with_admin: YesNo = YesNo.NO,
  ): Promise<void> {
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
      /*restart cron*/
      const job = this.schedulerRegistry.getCronJob('withdrawal_cron');
      job.start();
    }
    return;
  }
  async saveDeposit(
    user_id: number,
    address: string,
    coin: Coin,
    network: string,
    start_block: number,
  ): Promise<void> {
    let obj = {
      user_id,
      to_address: address,
      coin,
      network,
      start_block,
    };

    await this.depositRepository.save(obj);
    if (network != 'Bitcoin') {
      /*restart cron*/
      const job = this.schedulerRegistry.getCronJob('deposit_cron');
      job.start();
    }
    return;
  }
  async updateWebhookId(
    transaction_hash: string,
    hook_id: string,

    to: string,
    coin: Coin,
    network: string,
  ): Promise<any> {
    let g;
    if (hook_id !== undefined) {
      g = await this.withdrawalRepository.update(
        { coin, network, transaction_hash, to_address: to },
        { webhook_id: hook_id },
      );
    }
    return g;
  }
  async updateWtihdrawalStatus(
    transaction_hash: string,
    status: Status,
  ): Promise<void> {
    await this.withdrawalRepository.update(
      { transaction_hash },
      { status: status },
    );
    if (status == Status.Approved) {
      let with_info: Withdrawal = await this.withdrawalRepository.findOne({
        where: { transaction_hash },
      });
      if (with_info) {
        await this.walletRepository.decrement(
          {
            user_id: with_info['user_id'],
            network: with_info.network,
          },
          'balance',
          with_info['with_amount'],
        );
      }
    }
    return;
  }
  async updateWtihdrawalById(
    id: number,
    data: Partial<Withdrawal>,
  ): Promise<void> {
    await this.withdrawalRepository.update({ id }, data);

    return;
  }
  async updateDepositById(id: number, data: Partial<Deposit>): Promise<void> {
    await this.depositRepository.update({ id }, data);

    return;
  }
  async updateWallet(
    user_id: number,
    amount: number,
    from_address: string,
    coin: Coin,
    network: string,
    toDo: string,
  ): Promise<void> {
    let balance_column = coin.toLowerCase() + '_balance';
    let setString =
      toDo == 'Inc'
        ? `${balance_column} +${amount}`
        : `${balance_column} -${amount}`;

    if (toDo == 'Inc') {
      await this.walletRepository.increment(
        {
          user_id: user_id,
          network: network,
          deposit_address: from_address,
        },
        balance_column,
        amount,
      );
    } else {
      await this.walletRepository.decrement(
        {
          user_id: user_id,
          network: network,
          deposit_address: from_address,
        },
        balance_column,
        amount,
      );
    }
    return;
  }

  async checkForPendingDeposit(
    user_id: number,
    coin: Coin,
    network: string,
    to_address,
  ): Promise<boolean> {
    let c = await this.depositRepository.findOne({
      where: { user_id, coin, network, deleted: YesNo.NO, to_address },
    });
    if (c) return true;
    else return false;
  }
  async findDbWithdrawalSourceAddress(
    coin: Coin,
    network: string,
    amount: number,
  ): Promise<boolean | TokenAddressBalance> {
    let c = await this.tokenAddressBalanceRepository.findBy({
      coin: Equal(coin),
      network: Equal(network),
      balance: MoreThanOrEqual(amount),
    });
    if (c.length > 0) return c[0];
    else return false;
  }
  async updateTokenAddressBalance(
    id: number,
    amount,
    todo: string,
  ): Promise<any> {
    return todo == 'Inc'
      ? await this.tokenAddressBalanceRepository.increment(
          { id: id },
          'balance',
          amount,
        )
      : await this.tokenAddressBalanceRepository.decrement(
          { id: id },
          'balance',
          amount,
        );
  }
  async saveTokenAddressBalance(
    address: string,
    coin: Coin,
    network: string,
    amount: number,
    todo = 'Inc',
  ): Promise<void> {
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
      let v =
        todo == 'Inc'
          ? await this.tokenAddressBalanceRepository.increment(
              obj,
              'balance',
              amount,
            )
          : await this.tokenAddressBalanceRepository.decrement(
              obj,
              'balance',
              amount,
            );
    } else {
      await this.tokenAddressBalanceRepository.save({
        address,
        coin,
        network,
        balance: amount,
      });
    }
  }
  async findUser(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }
  async findUserById(id: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
    });
  }
  async saveUser(user: User): Promise<User> {
    const salt = await bcrypt.genSalt();
    user.zasper_id = user.password;
    user.uuid = uuidv4();
    user.password = await bcrypt.hash(user.password, salt);

    return await this.userRepository.save(user);
  }
  async removeRefreshToken(userId: number) {
    return await this.userRepository.update(userId, {
      refreshToken: null,
    });
  }
  async updateUser(uuid: string, data: Partial<User>) {
    //  const rawData = await this.dataSource.query(
    //    "UPDATE tbl_users SET `email`='sdsd@gmail.com'",
    //  );
    return await this.userRepository.update({ uuid: uuid }, data);
  }
  async updateUserById(id: any, data: Partial<User>) {
    //  const rawData = await this.dataSource.query(
    //    "UPDATE tbl_users SET `email`='sdsd@gmail.com'",
    //  );
    return await this.userRepository.update({ id: id }, data);
  }
  async existUserData(data: Partial<User>) {
    return await this.userRepository.findOne({ where: data });
  }
  async updateIdentity(data: {
    user_id: number;
    front_path: string;
    back_path: string;
    pan: string;
    selfie: string;
    type: string;
    gov_id: string;
    country: string;
    full_name: string;
    address: string;
  }) {
    const exist = await this.identityRepository.findOne({
      where: { user_id: data.user_id },
    });
    let q = null;
    // if (!exist)
    //    q = `INSERT  tbl_identity(user_id,font_path,back_path,pan,selfie,gov_id,type,country,address,full_name)
    //    VALUES(${data.user_id},'${data.adhar_front}','${data.adhar_back}','${data.pan}','${data.selfie}','${data.gov_id}','${data.type}',
    //    '${data.country}','${data.address}','${data.fullName}')`;
    // console.log('query', q);
    // else {
    //    q = `INSERT  tbl_identity(user_id,font_path,back_path,pan,selfie,gov_id,type,country,address,full_name)
    //    VALUES(${data.user_id},'${data.adhar_front}','${data.adhar_back}','${data.pan}','${data.selfie}','${data.gov_id}','${data.type}',
    //    '${data.country}','${data.address}','${data.fullName}')`;
    // }
    if (!exist) await this.identityRepository.insert(data);
    else await this.identityRepository.update({ user_id: data.user_id }, data);
    return;
  }
  async lastUpdatedTimeListener() {
    const rawData = await this.dataSource.query(
      'SELECT * FROM  listner_updated',
    );
    let g = JSON.parse(JSON.stringify(rawData));

    return g[0]['updated_at'];
  }
  async updateListenerTime() {
    let d = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const rawData = await this.dataSource.query(
      `UPDATE  listner_updated SET updated_at='${d}'`,
    );

    return;
  }
  async insertInBinanceTradeTablensertInB(
    user_id,
    clientOrderId,
    price,
    oQty,
    exQty,
    side,
    type,
    status,
    fills,
    symbol,
    orderId,
    cummulativeQuoteQty,
    settled_price,
  ) {
    let time = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let q =
      "INSERT INTO binance_trade (`user_id`,`clientOrderId`, `price`, `origQty`,`executedQty`,`status`,`type`,`side`,`fills`,`created_at`,`symbol`,`orderId`,`cummulativeQuoteQty`,`settled_price`) VALUES ('" +
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
  async updateBinanceTrade(
    clientOrderId,
    side,
    type,
    newStatus,
    symbol,
    orderId,
    date,
    execQty,
    settled_price,
  ) {
    let d = new Date(date).toISOString().slice(0, 19).replace('T', ' ');
    let q = `UPDATE  binance_trade SET \`status\`='${newStatus}',\`updated_at\`='${d}',\`executedQty\`='${execQty}'\`settled_price\`='${settled_price}' WHERE 
   \`clientOrderId\`='${clientOrderId}' AND \`orderId\`='${orderId}' AND \`side\`='${side}'
    AND \`type\`='${type}' AND \`symbol\`='${symbol}' `;

    const rawData = await this.dataSource.query(q);

    return;
  }
  async updateWalletQuery(q: string): Promise<void> {
    const rawData = await this.dataSource.query(q);

    return;
  }
  async insertEventData(clientOrderId, event_date, full_event_data) {
    let time = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let q = `INSERT INTO trade_event (\`clientOrderId\`, \`event\`, \`full_event\`) VALUES ('${clientOrderId}','${JSON.stringify(
      event_date,
    )}','${JSON.stringify(full_event_data)}')`;

    await this.dataSource.query(q);

    return;
  }
  async getOrderFromTable(orderId, user_id) {
    const rawData = await this.dataSource.query(
      `SELECT * FROM  binance_trade WHERE \`orderId\`='${orderId}' AND \`user_id\`='${user_id}' AND DATE(\`created_at\`)=DATE(NOW())`,
    );
    let g = JSON.parse(JSON.stringify(rawData));

    return g[0] !== undefined || g[0] != null ? g[0] : null;
  }
  async getAllUserOrderFromTable(user_id) {
    const rawData = await this.dataSource.query(
      `SELECT * FROM  binance_trade WHERE  \`user_id\`='${user_id}'`,
    );
    let g = JSON.stringify(rawData);

    return g;
  }
  async deleteOrder(orderId, user_id) {
    const rawData = await this.dataSource.query(
      `DELETE FROM  binance_trade WHERE \`orderId\`='${orderId}' AND \`user_id\`='${user_id}'`,
    );
    console.log('delete order in service db');

    return;
  }
  async klineDataDRNH(interval:number,time_string:string) { 
    const rawData = await this.dataSource.query(`CALL kline(${interval},'${time_string}')`);
    let g = JSON.stringify(rawData);
    return g;
  }
}
