import { MiniAppWalletAuthSuccessPayload } from "@worldcoin/minikit-js";
import { createPublicClient, http, verifyMessage } from "viem";
import { mainnet } from "viem/chains";

interface VerifyResult {
  isValid: boolean;
  error?: string;
  siweMessageData?: {
    address: string;
    [key: string]: any;
  };
}

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

/**
 * Verifies a SIWE (Sign-In with Ethereum) message from World ID Wallet
 */
export async function verifySiweMessage(
  payload: MiniAppWalletAuthSuccessPayload,
  nonce: string
): Promise<VerifyResult> {
  try {
    if (!payload) return { isValid: false, error: "No payload provided" };
    if (!payload.message)
      return { isValid: false, error: "No message in payload" };
    if (!payload.signature)
      return { isValid: false, error: "No signature in payload" };
    if (!payload.address)
      return { isValid: false, error: "No address in payload" };

    // This is the crucial step: cryptographic verification
    const isValid = await verifyMessage({
      address: payload.address as `0x${string}`,
      message: payload.message,
      signature: payload.signature as `0x${string}`,
    });

    if (!isValid) {
      return { isValid: false, error: "Signature verification failed" };
    }

    // Additional check: Parse the SIWE message to verify the nonce
    const messageLines = payload.message.split("\n");
    const nonceLine = messageLines.find((line) => line.startsWith("Nonce:"));
    if (!nonceLine) {
      return { isValid: false, error: "No nonce found in message" };
    }
    const messageNonce = nonceLine.replace("Nonce:", "").trim();

    if (messageNonce !== nonce) {
      return {
        isValid: false,
        error: `Nonce mismatch. Got: ${messageNonce}, Expected: ${nonce}`,
      };
    }

    return {
      isValid: true,
      siweMessageData: { address: payload.address },
    };
  } catch (error) {
    console.error("Error verifying SIWE message:", error);
    return {
      isValid: false,
      error:
        error instanceof Error ? error.message : "Unknown verification error",
    };
  }
}
