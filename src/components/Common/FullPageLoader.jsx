import { Center } from "@mantine/core";
import CowLoader from "./CowLoader";

export default function FullPageLoader() {
  return (
    <Center h="100vh" w="100%" style={{ background: "#F8FAFC" }}>
      <CowLoader />
    </Center>
  );
}