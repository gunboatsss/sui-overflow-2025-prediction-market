import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Flex, Heading, Text } from "@radix-ui/themes";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";
import { useFetchPredictionMarket } from "./hooks/useFetchPredictionMarket";
import { usePlaceBet } from "./hooks/usePlaceBet";

const PACKAGE_ID = '0xd3fd1ca00e489bedef3a3f9391a984358cb7acc892ab8daf8a7efd1898daac6c';

function convertToSui(s: string) {
  const mist = BigInt(s);
  return `${(mist / MIST_PER_SUI)}.${(mist % MIST_PER_SUI)}`
}

export function PredictionMarket() {
  // const account = useCurrentAccount();
  const coin = /<([:0-9A-Za-z]*)>/;
  const { data, isLoading, error } = useFetchPredictionMarket();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction({
    onError: (e) => console.log(e)
  });

  function resolve(e: React.MouseEvent<HTMLButtonElement, MouseEvent>, objectId: string, coin: string) {
    e;
    const tx = new Transaction();
    console.log(coin);
    tx.moveCall({
      target: `${PACKAGE_ID}::supply::resolve`,
      arguments: [
        tx.object(objectId)
      ],
      typeArguments: [
        coin
      ]
    });
    console.log(objectId);
    signAndExecuteTransaction({
      transaction: tx,
    })
  }
  // console.log(data);

  if (error) {
    return <Flex>Error: {error.message}</Flex>;
  }

  if (isLoading) {
    return <Flex>Loading...</Flex>;
  }

  return (
    <Flex direction="column" my="2">
      {
        data?.map(market => (
          <Flex key={market.objectId} direction="column" style={
            {
              padding: 10,
              margin: 20,
            }
          }>
            <Heading>Market ID: {market.objectId}</Heading>
            <Text>Question: PLACEHOLDER ENCRYPTED BY SEAL</Text>
            <Text>Pot: {convertToSui(market.balance)}</Text>
            <Text>Friend{'\n'}{'\n'}</Text>
            {market.friends.map(friend => (
              <Flex><Text key={friend}>{`${friend}`}<br></br></Text></Flex>
            ))}
            <Text>Yes vote: {market.yes_vote}, No vote: {market.no_vote}</Text>
            <input id="yes" type="number"></input>
            <button style={
              {
                padding: 10,
                margin: 20,
              }}
              onClick={() => {
                console.log(market);
                const yes = document.getElementById("yes") as HTMLInputElement;
                let [integer, decimal = '0'] = yes?.value?.split('.') as string[];
                let bigintValue = BigInt(integer) * BigInt(10 ** 9);
                if (decimal.length > 9) {
                  decimal = decimal.substring(0, 9);
                }
                bigintValue = bigintValue + (BigInt(decimal) * BigInt(10 ** (9 - decimal.length)));
                signAndExecuteTransaction({
                  transaction: usePlaceBet(market.objectId, coin.exec(market.type)?.[1] as string, bigintValue, true),
                })
              }}
            >Bet Yes</button>
            <input id="no" type="number"></input>
            <button style={{
              padding: 10,
              margin: 20,
            }}
              onClick={() => {
                const no = document.getElementById("no") as HTMLInputElement;
                let [integer, decimal = '0'] = no?.value?.split('.') as string[];
                let bigintValue = BigInt(integer) * BigInt(10 ** 9);
                if (decimal.length > 9) {
                  decimal = decimal.substring(0, 9);
                }
                bigintValue = bigintValue + (BigInt(decimal) * BigInt(10 ** (9 - decimal.length)));
                console.log(bigintValue);
                signAndExecuteTransaction({
                  transaction: usePlaceBet(market.objectId, coin.exec(market.type)?.[1] as string, bigintValue, false),
                })
              }
              }
            >Bet No</button>
            <button style={
              {
                padding: 10,
                margin: 20,
              }}>Vote Yes</button>
            <button style={
              {
                padding: 10,
                margin: 20,
              }}>Vote No</button>
            <button style={
              {
                padding: 10,
                margin: 20,
              }}
              onClick={(e) => resolve(e, market.objectId, coin.exec(market.type)?.[1] as string)}
            >Resolve</button>
          </Flex>
        )
        )
      }

    </Flex>
  );
}
