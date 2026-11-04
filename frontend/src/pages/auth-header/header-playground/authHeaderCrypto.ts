// ONDC authorization header creation and verification, run entirely in the browser.
// Signing string, signing and signature checks come from ONDC's official SDK
// (ondc-crypto-sdk-nodejs), so the Playground signs exactly the way network participants do.
// Key handling, which the SDK does not provide, uses the browser's built-in Web Crypto (Ed25519).
import {
    createAuthorizationHeader as sdkCreateAuthorizationHeader,
    signMessage,
    verifyMessage,
} from "ondc-crypto-sdk-nodejs";
import { createSigningString } from "ondc-crypto-sdk-nodejs/lib/utility";

const BASE64_RE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

function fromBase64(value: string): Uint8Array {
    if (!BASE64_RE.test(value)) throw new Error("invalid base64");
    return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

function toBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
}

function fromBase64Url(value: string): Uint8Array {
    const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
    return fromBase64(b64.padEnd(Math.ceil(b64.length / 4) * 4, "="));
}

// PKCS#8 header for a raw 32-byte Ed25519 seed (RFC 8410).
const ED25519_PKCS8_PREFIX = new Uint8Array([
    0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20,
]);

/** The Ed25519 public key for a 32-byte seed. */
async function publicKeyFromSeed(seed: Uint8Array): Promise<Uint8Array> {
    const pkcs8 = new Uint8Array(ED25519_PKCS8_PREFIX.length + seed.length);
    pkcs8.set(ED25519_PKCS8_PREFIX);
    pkcs8.set(seed, ED25519_PKCS8_PREFIX.length);
    const key = await crypto.subtle.importKey("pkcs8", pkcs8, { name: "Ed25519" }, true, ["sign"]);
    const { x } = await crypto.subtle.exportKey("jwk", key);
    return fromBase64Url(x ?? "");
}

/** seed + public key: the 64-byte private key form the ONDC SDK expects. */
function concatKey(seed: Uint8Array, publicKey: Uint8Array): Uint8Array {
    const key = new Uint8Array(64);
    key.set(seed);
    key.set(publicKey, 32);
    return key;
}

export function toHex(bytes: Uint8Array): string {
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface PayloadWarning {
    id: "trailing-newline" | "crlf" | "bom";
    message: string;
}

export function payloadWarnings(payload: string): PayloadWarning[] {
    const warnings: PayloadWarning[] = [];
    if (payload.startsWith("﻿")) {
        warnings.push({ id: "bom", message: "Payload starts with a UTF-8 BOM." });
    }
    if (payload.includes("\r\n")) {
        warnings.push({ id: "crlf", message: "Payload contains CRLF line endings." });
    }
    if (/\n$/.test(payload)) {
        warnings.push({ id: "trailing-newline", message: "Payload ends with a newline." });
    }
    return warnings;
}

/** Signing string and digest exactly as the ONDC SDK builds them. */
export async function buildSigningString(
    payload: string,
    created: number,
    expires: number
): Promise<{ signingString: string; digestBase64: string; digestHex: string }> {
    const { signingString } = await createSigningString({
        message: payload,
        created: String(created),
        expires: String(expires),
    });
    const digestBase64 = signingString.split("BLAKE-512=")[1] ?? "";
    return {
        signingString,
        digestBase64,
        digestHex: toHex(fromBase64(digestBase64)),
    };
}

/**
 * Accepts a Base64 Ed25519 private key as a 32-byte seed or a 64-byte key (seed + public key)
 * and returns the 64-byte form the ONDC SDK requires, plus the matching public key.
 */
export async function normalizePrivateKey(
    privateKeyBase64: string
): Promise<{ privateKey: string; publicKey: string }> {
    let bytes: Uint8Array;
    try {
        bytes = fromBase64(privateKeyBase64.trim());
    } catch {
        throw new Error("Private key is not valid Base64.");
    }
    if (bytes.length !== 32 && bytes.length !== 64) {
        throw new Error(`Private key must be 32 or 64 bytes; got ${bytes.length} bytes.`);
    }
    const seed = bytes.slice(0, 32);
    const publicKey = await publicKeyFromSeed(seed);
    if (bytes.length === 64 && toBase64(bytes.slice(32)) !== toBase64(publicKey)) {
        throw new Error(
            "64-byte private key is inconsistent: its last 32 bytes are not the matching public key."
        );
    }
    return {
        privateKey: toBase64(concatKey(seed, publicKey)),
        publicKey: toBase64(publicKey),
    };
}

/** A fresh Ed25519 key pair, private key in the 64-byte form used by ONDC. */
export async function generateDemoKeyPair(): Promise<{ privateKey: string; publicKey: string }> {
    const keyPair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
        "sign",
        "verify",
    ])) as CryptoKeyPair;
    const { d, x } = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
    const publicKey = fromBase64Url(x ?? "");
    return {
        privateKey: toBase64(concatKey(fromBase64Url(d ?? ""), publicKey)),
        publicKey: toBase64(publicKey),
    };
}

export interface CreateHeaderInput {
    payload: string;
    privateKey: string;
    subscriberId: string;
    uniqueKeyId: string;
    created: number;
    ttl: number;
}

export interface CreateHeaderResult {
    payloadBytes: number;
    digestHex: string;
    digestBase64: string;
    created: number;
    expires: number;
    signingString: string;
    signatureBase64: string;
    publicKey: string;
    header: string;
}

export async function createAuthorizationHeader(
    input: CreateHeaderInput
): Promise<CreateHeaderResult> {
    const { privateKey, publicKey } = await normalizePrivateKey(input.privateKey);
    const expires = input.created + input.ttl;
    const { signingString, digestBase64, digestHex } = await buildSigningString(
        input.payload,
        input.created,
        expires
    );
    const signatureBase64 = await signMessage({ signingString, privateKey });
    const header = await sdkCreateAuthorizationHeader({
        body: input.payload,
        privateKey,
        subscriberId: input.subscriberId,
        subscriberUniqueKeyId: input.uniqueKeyId,
        created: String(input.created),
        expires: String(expires),
    });
    return {
        payloadBytes: new TextEncoder().encode(input.payload).length,
        digestHex,
        digestBase64,
        created: input.created,
        expires,
        signingString,
        signatureBase64,
        publicKey,
        header,
    };
}

export function parseAuthorizationHeader(header: string): Record<string, string> {
    const fields: Record<string, string> = {};
    for (const match of header.matchAll(/(\w+)="([^"]*)"/g)) fields[match[1]] = match[2];
    return fields;
}

export type VerifyStepStatus = "pass" | "fail" | "skip";

export interface VerifyStep {
    label: string;
    status: VerifyStepStatus;
    detail: string;
}

export interface VerifyResult {
    valid: boolean;
    reason: string;
    fields: Record<string, string>;
    digestBase64?: string;
    signingString?: string;
    steps: VerifyStep[];
}

export async function verifyAuthorizationHeader(
    header: string,
    payload: string,
    publicKeyBase64: string,
    now: number
): Promise<VerifyResult> {
    const steps: VerifyStep[] = [];
    const fail = (
        reason: string,
        fields: Record<string, string>,
        extra: Partial<VerifyResult> = {}
    ): VerifyResult => ({
        valid: false,
        reason,
        fields,
        steps,
        ...extra,
    });

    const fields = parseAuthorizationHeader(header);
    const missing = ["keyId", "algorithm", "created", "expires", "headers", "signature"].filter(
        (k) => !(k in fields)
    );
    if (missing.length > 0) {
        steps.push({
            label: "Parse header",
            status: "fail",
            detail: `Missing field(s): ${missing.join(", ")}`,
        });
        return fail(`Header is missing ${missing.join(", ")}.`, fields);
    }
    steps.push({ label: "Parse header", status: "pass", detail: `keyId="${fields.keyId}"` });

    if (fields.algorithm !== "ed25519") {
        steps.push({
            label: "Check algorithm",
            status: "fail",
            detail: `algorithm="${fields.algorithm}"`,
        });
        return fail(`Algorithm must be "ed25519", got "${fields.algorithm}".`, fields);
    }
    steps.push({ label: "Check algorithm", status: "pass", detail: 'algorithm="ed25519"' });

    const created = Number(fields.created);
    const expires = Number(fields.expires);
    if (!Number.isInteger(created) || !Number.isInteger(expires)) {
        steps.push({
            label: "Check timestamps",
            status: "fail",
            detail: "created/expires are not integers",
        });
        return fail("created and expires must be Unix timestamps.", fields);
    }
    if (created > now) {
        steps.push({
            label: "Check timestamps",
            status: "fail",
            detail: `created is ${created - now}s in the future`,
        });
        return fail("Header is not yet valid (created is in the future).", fields);
    }
    if (now > expires) {
        steps.push({
            label: "Check timestamps",
            status: "fail",
            detail: `expired ${now - expires}s ago`,
        });
        return fail("Header has expired.", fields);
    }
    steps.push({
        label: "Check timestamps",
        status: "pass",
        detail: `valid for another ${expires - now}s`,
    });

    const { signingString, digestBase64 } = await buildSigningString(payload, created, expires);
    steps.push({ label: "Hash payload (BLAKE-512)", status: "pass", detail: digestBase64 });
    steps.push({ label: "Rebuild signing string", status: "pass", detail: signingString });

    const ok = await verifyMessage({
        signedString: fields.signature,
        signingString,
        publicKey: publicKeyBase64.trim(),
    });
    if (!ok) {
        steps.push({
            label: "Verify signature (Ed25519)",
            status: "fail",
            detail: "signature does not match",
        });
        return fail(
            "Signature does not match. Either the payload changed after signing (even whitespace or key order), or the public key does not belong to the signing key.",
            fields,
            { digestBase64, signingString }
        );
    }
    steps.push({ label: "Verify signature (Ed25519)", status: "pass", detail: "signature valid" });
    return { valid: true, reason: "", fields, digestBase64, signingString, steps };
}

/**
 * The worked example from ONDC's official signing guide
 * (ONDC-Official/developer-docs, registry/signing-verification.md). The keys are published
 * there for illustration only — never register them.
 */
export const TEST_VECTOR = {
    privateKey:
        "lP3sHA+9gileOkXYJXh4Jg8tK0gEEMbf9yCPnFpbldhrAY+NErqL9WD+Vav7TE5tyVXGXBle9ONZi2W7o144eQ==",
    publicKey: "awGPjRK6i/Vg/lWr+0xObclVxlwZXvTjWYtlu6NeOHk=",
    subscriberId: "example-bap.com",
    uniqueKeyId: "bap1234",
    payload:
        '{"context":{"domain":"nic2004:60212","country":"IND","city":"Kochi","action":"search","core_version":"0.9.1","bap_id":"bap.stayhalo.in","bap_uri":"https://8f9f-49-207-209-131.ngrok.io/protocol/","transaction_id":"e6d9f908-1d26-4ff3-a6d1-3af3d3721054","message_id":"a2fe6d52-9fe4-4d1a-9d0b-dccb8b48522d","timestamp":"2022-01-04T09:17:55.971Z","ttl":"P1M"},"message":{"intent":{"fulfillment":{"start":{"location":{"gps":"10.108768, 76.347517"}},"end":{"location":{"gps":"10.102997, 76.353480"}}}}}}',
    created: 1641287875,
    ttl: 3600,
    expectedDigest:
        "b6lf6lRgOweajukcvcLsagQ2T60+85kRh/Rd2bdS+TG/5ALebOEgDJfyCrre/1+BMu5nA94o4DT3pTFXuUg7sw==",
    expectedSignature:
        "cjbhP0PFyrlSCNszJM1F/YmHDVAWsZqJUPzojnE/7TJU3fJ/rmIlgaUHEr5E0/2PIyf0tpSnWtT6cyNNlpmoAQ==",
} as const;
