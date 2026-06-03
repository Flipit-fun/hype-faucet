import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
} from "@solana/spl-token";
import bs58 from "bs58";
import { hasWalletClaimed, hasIPClaimed, recordClaim } from "@/lib/db";

function getClientIP(request: NextRequest): string {
  // Check common headers for real IP behind proxies (Vercel sets x-forwarded-for)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }
  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const { wallet } = await request.json();

    // Validate wallet address
    if (!wallet || typeof wallet !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid Solana wallet address." },
        { status: 400 }
      );
    }

    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(wallet);
      if (!PublicKey.isOnCurve(recipientPubkey)) {
        throw new Error("Not on curve");
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid Solana wallet address." },
        { status: 400 }
      );
    }

    // Get client IP
    const clientIP = getClientIP(request);

    // Check if this wallet already claimed
    if (await hasWalletClaimed(wallet)) {
      return NextResponse.json(
        { error: "This wallet has already claimed. One claim per wallet." },
        { status: 429 }
      );
    }

    // Check if this IP already claimed
    if (await hasIPClaimed(clientIP)) {
      return NextResponse.json(
        { error: "This network has already claimed. One claim per network." },
        { status: 429 }
      );
    }

    // Load environment variables
    const privateKey = process.env.TREASURY_PRIVATE_KEY;
    const mintAddress = process.env.HYPE_TOKEN_MINT;
    const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
    const claimAmount = parseInt(process.env.CLAIM_AMOUNT || "694444", 10);

    if (!privateKey || !mintAddress) {
      return NextResponse.json(
        { error: "Server configuration error. Please contact admin." },
        { status: 500 }
      );
    }

    // Setup Solana connection and treasury keypair
    const connection = new Connection(rpcUrl, "confirmed");
    const treasuryKeypair = Keypair.fromSecretKey(bs58.decode(privateKey));
    const mintPubkey = new PublicKey(mintAddress);

    // Get treasury token account
    const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      treasuryKeypair,
      mintPubkey,
      treasuryKeypair.publicKey
    );

    // Get or create recipient token account
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      treasuryKeypair, // payer for creating the account if needed
      mintPubkey,
      recipientPubkey
    );

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      treasuryTokenAccount.address,
      recipientTokenAccount.address,
      treasuryKeypair.publicKey,
      claimAmount
    );

    // Build and send transaction
    const transaction = new Transaction().add(transferInstruction);
    transaction.feePayer = treasuryKeypair.publicKey;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    transaction.sign(treasuryKeypair);
    const signature = await connection.sendRawTransaction(
      transaction.serialize()
    );

    // Wait for confirmation
    await connection.confirmTransaction(signature, "confirmed");

    // Record the claim in Supabase
    await recordClaim(wallet, clientIP, signature);

    return NextResponse.json({
      success: true,
      message: `$0.05 worth of $HYPE sent successfully!`,
      signature,
      explorer: `https://solscan.io/tx/${signature}`,
    });
  } catch (error: unknown) {
    console.error("Claim error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Transfer failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
