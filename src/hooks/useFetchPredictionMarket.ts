import { useState, useEffect, useContext } from "react";
import { SuiClientContext } from "@mysten/dapp-kit";
import { MoveStruct } from "@mysten/sui/client";

import { PACKAGE_ID } from "../constants";

type MarketCreatedEvent = {
    market_id: string
}

type Market = {
    objectId: string,
    type: string,
    balance: string,
    friends: string[],
    yes_vote: string,
    no_vote: string
} & MoveStruct;

function useFetchPredictionMarket() {
    const [data, setData] = useState<Market[]>([]);
    const [isLoading, setisLoading] = useState(true);
    const [error, setError] = useState<Error>();
    const client = useContext(SuiClientContext)?.client;
    useEffect(() => {
        if(client === undefined) {
            setisLoading(false);
            setError(Error("Client not found"));
            return;
        };
        client.queryEvents({
            query: {
                MoveEventType: `${PACKAGE_ID}::MarketCreated`
            }
        }).then(
            (events) =>
                events.data.map((event) => {
                    const parsedJson = event.parsedJson as MarketCreatedEvent;
                    return parsedJson.market_id;
                })
        ).then(
            (marketIds) => client.multiGetObjects({
                ids: marketIds,
                options: {
                    showContent: true,
                    showType: true
                }
            })
        ).then(
            (markets) => {
            let res = markets.map((object) => {
                if(object.data?.content?.dataType == "moveObject") {
                    let id = object.data?.objectId;
                    let fields = object.data?.content.fields;
                    // console.log(object.data);
                    return {
                        objectId: id,
                        type: object.data.type,
                        ...fields
                    } as Market;
                }
            }).filter((market) => market !== undefined);
            setData(res);
            setisLoading(false);
        }).catch((err) => {
            if(err instanceof Error) {
                setError(err);
            }
            else {
                setError(new Error(JSON.stringify(err)));
            }
        });
    }, [])
    return { data, isLoading, error }
}
export {useFetchPredictionMarket};