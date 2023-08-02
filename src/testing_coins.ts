// const y:any = {
//   Bitcoin: {
//     fromAddress: {
//       pk: '36656af3397ac42f79898ed040f85c06a12ec5d08f0e5754b58c6450bb0733f0',
//       pub: 'mqUkrTzmUYqw2BMvAueQgP7pX7PKzfoAyF',
//     },
//     toAddress: {
//       pk: '1c05060b8b8089ab78e7d1ff89ae3ab654d2f539a0593c1664688818ff175e9d',
//       pub: 'mn3uHiDLjkyfYXUgD8gWTAYGUsLUXmnHap',
//     },
//   BNB test beacon: {
//     toAddress: {
//       pk: '36656af3397ac42f79898ed040f85c06a12ec5d08f0e5754b58c6450bb0733f0',
//       pub: 'tbnb1ezt8yhmwp6vpl33kze9tpqz8yce20fc99lcmhl',
//     },
//     fromAddress: {
//       pk: 'da779acfb06e3a8cc93852126d0160158114feab57fa0a368f1ba4dc66267cec',
//       pub: 'tbnb16954vyapy9v7x5uftsaen3c3hyaxfzsdcs9ccp',
//     }
//   }
//eth{
//    fromAddress: {
// pk:b5b2e07da3e4a9663e227dfc1d8af90a3dbce847a784669596c70da1f3ec8e44;
//       pub:0xc9A89369EdC7D3eBe7AA97AE5aff939d0367263F    /sepaolia token hai ismein
//   }
//toAddress:{
//  pub:0x3AFE52271B95ef328d9FcBefBbCCbA12FA6d2745
//private:e546a9a18a291d4feb611b74be02a7390d6923323c61f787ba8a1f4ffb6b6305  ismein bhi spaolia
//}
//}
//bep20,usdt,BTCb,bnb{
//    fromAddress: {
// pk:e546a9a18a291d4feb611b74be02a7390d6923323c61f787ba8a1f4ffb6b6305;
//       pub:0x3AFE52271B95ef328d9FcBefBbCCbA12FA6d2745    /akki aade
//   }
//toAddress:{
//  pub:0xe62f6736B58A3Bd38ec2B340Deff6a99Ea447be5
//private:e546a9a18a291d4feb611b74be02a7390d6923323c61f787ba8a1f4ffb6b6305  ismein bhi spaolia
//}
//}
// }
 /* const owner_pk of drnh =
      '0x4dcbfa0049f7e4e7778e6102f3c54257ed7653e7e6e0a47a2e70c676fd480481';
    const pk =
      'e546a9a18a291d4feb611b74be02a7390d6923323c61f787ba8a1f4ffb6b6305';*/ //akk;

/*1- btc withdrawl is confrimed usign webhook jo ki client side se withdrawa lke baad us address ke liye by post create hota taki us webhook pe post request a kake on withdral 
confirm. and we futher do whatver we want to do
1-USDt transfer testing can be done using mainet only akki wala account has USDT bep20 
3-to show blancein erc20 token name 
const balanceFormatted= ethers.utils.formatUnits(balance, 18)
console.log("Holder's balance is " + balanceFormatted + " " + tokenSymbol)
4- User instanly withdrawl sumit karega jo databse mein save hoga with trnsaction hash not confirmed,and every time withdrl save cron is started and loop trough pendni
transaction and web3 getreceipt se status check karlega agar okk hai to wallet deduct and status to p
https://api.bscscan.com/api?module=account&action=balance&address=0x3AFE52271B95ef328d9FcBefBbCCbA12FA6d2745&&apikey=UKHMWR7KTHCRJJVUFJTDUWRUYA2QXCC5MQ
*/