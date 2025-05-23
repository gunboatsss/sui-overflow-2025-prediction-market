import { ConnectButton } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { PredictionMarket } from "./PredictionMarket";
import { CreateNewMarket } from "./CreateNewMarket";

function App() {
  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Box>
          <Heading style={
            {
              color: "red",
              fontWeight: "bold",
              fontFamily: "Comic Sans MS, Comic Neue, cursive",
              fontSize: '20 px'
            }
          }>D.A.R.E!</Heading>
        </Box>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>
        <Container
          mt="5"
          pt="2"
          px="4"
          style={{ background: "var(--gray-a2)", minHeight: 500 }}
        >
          <CreateNewMarket />
        </Container>
      <Container>
        <Container
          mt="5"
          pt="2"
          px="4"
          style={{ background: "var(--gray-a2)", minHeight: 500 }}
        >
          <PredictionMarket />
        </Container>
      </Container>
    </>
  );
}



export default App;
