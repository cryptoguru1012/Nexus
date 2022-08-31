import { readFileSync } from 'fs';
import { LCDClient,  Wallet, MsgStoreCode, Msg, MsgExecuteContract, getContractAddress, getCodeId, Coins, BlockTxBroadcastResult, TxError, MsgInstantiateContract, Coin, StdFee  } from '@terra-money/terra.js';

export async function create_contract(lcd_client: LCDClient, sender: Wallet, contract_name: string, wasm_path: string, init_msg: object): Promise<string> {
	let code_id = await store_contract(lcd_client, sender, wasm_path);
	console.log(`${contract_name} uploaded\n\tcode_id: ${code_id}`);
	let contract_addr = await instantiate_contract(lcd_client, sender, sender.key.accAddress, code_id, init_msg);
	console.log(`${contract_name} instantiated\n\taddress: ${contract_addr}`);
	return contract_addr;
}

export async function store_contract(lcd_client: LCDClient, sender: Wallet, wasm_path: string): Promise<number> {
	let contract_wasm = readFileSync(wasm_path, {encoding: 'base64'});
	const messages: Msg[] = [new MsgStoreCode(sender.key.accAddress, contract_wasm)];

	while (true) {
		let result = await calc_fee_and_send_tx(lcd_client, sender, messages);
		if (result !== undefined && isTxSuccess(result)) {
			return parseInt(getCodeId(result));
		} else {
			await sleep(1000);
		}
	}
}

export function sleep(ms: number) {
	return new Promise(
		resolve => setTimeout(resolve, ms, [])
	);
}

async function instantiate_contract_raw(lcd_client: LCDClient, sender: Wallet, admin: string, code_id: number, init_msg: object): Promise<BlockTxBroadcastResult> {
	const messages: Msg[] = [new MsgInstantiateContract(
		    sender.key.accAddress,
			code_id,
			init_msg,
            undefined,
            true,
            sender.key.accAddress,
            admin,
	)];

	while (true) {
		let result = await calc_fee_and_send_tx(lcd_client, sender, messages);
		if (result !== undefined && isTxSuccess(result)) {
			return result;
		} else {
			await sleep(1000);
		}
	}
}

export async function instantiate_contract(lcd_client: LCDClient, sender: Wallet, admin: string, code_id: number, init_msg: object): Promise<string> {
	let result = await instantiate_contract_raw(lcd_client, sender, admin, code_id, init_msg);
	return getContractAddress(result)
}

export async function execute_contract(lcd_client: LCDClient, sender: Wallet, contract_addr: string, execute_msg: object): Promise<BlockTxBroadcastResult | undefined> {
	const messages: Msg[] = [new MsgExecuteContract(
		sender.key.accAddress,
		contract_addr,
		execute_msg
	)];
	let result = await send_message(lcd_client, sender, messages);
	return result
}

export async function send_message(lcd_client: LCDClient, sender: Wallet, messages: Msg[]) {
	let result = await calc_fee_and_send_tx(lcd_client, sender, messages);
	return result
}


export async function calc_fee_and_send_tx(lcd_client: LCDClient, sender: Wallet, messages: Msg[]): Promise<BlockTxBroadcastResult | undefined> {
	try {
		const estimated_tx_fee = await get_tx_fee(lcd_client, sender, messages);
		if (estimated_tx_fee === undefined) {
			return undefined;
		}
        

		const signed_tx = await sender.createAndSignTx({
			msgs: messages,
			fee: estimated_tx_fee,
		});
        
		const tx_result = await lcd_client.tx.broadcast(signed_tx);
		return tx_result;
	} catch (err) {
		console.error(`calc_fee_and_send_tx return err: ${err}`)
		return undefined;
	}
}

async function get_tx_fee(lcd_client: LCDClient, sender: Wallet, msgs: Msg[]): Promise<StdFee | undefined> {
	try {
		const estimated_fee_res = await lcd_client.tx.estimateFee(sender.key.accAddress, msgs, {
			gasPrices: new Coins([new Coin("uluna", 0.0113303)]),
			gasAdjustment: 1.2,
			feeDenoms: ["uluna"],
		});
		return estimated_fee_res;
	} catch (err) {
		console.error(`get_tax_rate return err: ${err}`)
		return undefined;
	}
}

function isTxFailed(tx: any): boolean {
    return tx.code !== undefined
  }

  
export function isTxSuccess(tx: BlockTxBroadcastResult, write_to_log: boolean = true): boolean {
	if (isTxFailed(tx)) {
		if (write_to_log) {
			const failed_tx = tx as TxError;
			console.log(`failed Tx; hash: ${tx.txhash}, code: ${failed_tx.code}, codespace: ${failed_tx.codespace}, error: ${JSON.stringify(tx)}`)
		}
		return false;
	}

	return true;
}
