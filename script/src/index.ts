import { LCDClient, MnemonicKey, WasmAPI } from '@terra-money/terra.js';
import {create_contract, execute_contract, isTxSuccess} from './utils';
// connect to bombay testnet
const main = async ()=>{
    const terra = new LCDClient({
        URL: 'https://bombay-lcd.terra.dev',
        chainID: 'bombay-12',
    });

    const mk = new MnemonicKey({
        mnemonic:
        'hundred student mail february buyer found print keep pond all gym win unique latin pipe ski hurry ivory heart run inquiry among arrange thumb',
    });

    
    const wallet = terra.wallet(mk);

    const contract_address = await create_contract(terra, wallet, "testcontract1", "contract.wasm", {});
    console.log(contract_address);
    // const contract_address = "terra16wlvcatukp9ezep728qlucmsesj8y7tgne2rm6";
    const result_set = await execute_contract(terra, wallet, contract_address, {set:{x:10}});
    if (result_set !== undefined && isTxSuccess(result_set)) {
        console.log(`Successfully set x is 10'`);
    }

    const result = await execute_contract(terra, wallet, contract_address, {increment:{}});
    if (result !== undefined && isTxSuccess(result)) {
        console.log(`Successfully increment x`);
    }
    const result_query = await terra.wasm.contractQuery(contract_address, {get:{}})
    console.log(result_query);

}

main();


