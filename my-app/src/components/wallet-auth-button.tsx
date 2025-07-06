"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { MiniKit } from "@worldcoin/minikit-js";

interface WalletAuthButtonProps {
  onSuccess?: () => void;
}

export function WalletAuthButton({ onSuccess }: WalletAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleWalletAuth = async () => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/nonce");
      const { nonce } = await res.json();
      console.log("nonce", nonce);
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce,
        expirationTime: new Date(new Date().getTime() + 1 * 60 * 60 * 1000),
        statement: "Sign in with your World ID wallet",
      });

      if (finalPayload.status === "error") {
        throw new Error(finalPayload.error_code);
      }

      const verifyRes = await fetch("/api/complete-siwe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: finalPayload,
          nonce,
        }),
      });
      console.log("verifyRes", verifyRes);
      const verification = await verifyRes.json();
      console.log("verification", verification);

      if (verification.isValid) {
        await signIn("worldcoin-wallet", {
          message: finalPayload.message,
          signature: finalPayload.signature,
          address: finalPayload.address,
          nonce,
          redirect: false,
        });

        // Call onSuccess if provided
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error("Wallet auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleWalletAuth}
      disabled={isLoading}
      className="w-full max-w-xs px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg shadow-md hover:from-green-700 hover:to-emerald-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 mr-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Connecting...</span>
        </>
      ) : (
        <span>Connect Wallet</span>
      )}
    </button>
  );
}
