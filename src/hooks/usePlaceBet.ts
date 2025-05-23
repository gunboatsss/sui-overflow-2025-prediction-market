import { PACKAGE_ID } from "../constants";
import { Transaction } from "@mysten/sui/transactions";

function usePlaceBet(marketId: string, coinType: string, amount: bigint, yesOrNo: boolean) {
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [amount]);
    const target = yesOrNo ? `${PACKAGE_ID}::buy_yes` : `${PACKAGE_ID}::buy_no`;
    tx.moveCall({
        target,
        arguments: [
            tx.object(marketId),
            coin
        ],
        typeArguments: [
            coinType
        ]
    });
    return tx;
}
export {usePlaceBet};