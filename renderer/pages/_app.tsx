import React from "react";
import type { AppProps } from "next/app";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";

import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider value={defaultSystem}>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        <Component {...pageProps} />
      </ThemeProvider>
    </ChakraProvider>
  );
}

export default MyApp;
