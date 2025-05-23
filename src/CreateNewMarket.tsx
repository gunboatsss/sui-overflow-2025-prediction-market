import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Flex } from "@radix-ui/themes";
import { PACKAGE_ID } from "./constants";
import { SUI_TYPE_ARG } from "@mysten/sui/utils";
import { useState } from "react";

export function CreateNewMarket() {
    const [err, setErr] = useState<string>();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction({});

    function createNewMarket() {
        const friends = (document.getElementById("friend") as HTMLInputElement).value.split(',');
        const tx = new Transaction();
        console.log("before");
        try {
            tx.moveCall({
                target: `${PACKAGE_ID}::create_market`,
                arguments: [
                    tx.pure.vector('address', friends)
                ],
                typeArguments: [
                    SUI_TYPE_ARG
                ]
            });
        } catch (err) {
            if(err instanceof Error) {
                setErr(err.message);
                return;
            }
        }
        signAndExecuteTransaction({
            transaction: tx
        }, {
            onError: (e) => {
                setErr(e.message);
                console.log("error");
                console.log(err);
            }
        })
    }

    return (
        <>
            <Flex direction="column" my="2">
                <label htmlFor="friend">List of Friend</label>
                <input type="text" id="friend"></input>
                <button onClick={() => createNewMarket()} style={
                    {
                        padding: 10,
                        margin: 20,
                    }}>Create Market
                </button>
                <p id="error">{err}</p>
            </Flex>
        </>
    );
}