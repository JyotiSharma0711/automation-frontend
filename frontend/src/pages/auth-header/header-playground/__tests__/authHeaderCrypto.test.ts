/**
 * @jest-environment node
 */
import { isHeaderValid } from "ondc-crypto-sdk-nodejs";
import {
    TEST_VECTOR,
    buildSigningString,
    createAuthorizationHeader,
    generateDemoKeyPair,
    normalizePrivateKey,
    payloadWarnings,
    verifyAuthorizationHeader,
} from "../authHeaderCrypto";

const fromVector = (privateKey: string = TEST_VECTOR.privateKey) =>
    createAuthorizationHeader({
        payload: TEST_VECTOR.payload,
        privateKey,
        subscriberId: TEST_VECTOR.subscriberId,
        uniqueKeyId: TEST_VECTOR.uniqueKeyId,
        created: TEST_VECTOR.created,
        ttl: TEST_VECTOR.ttl,
    });

describe("createAuthorizationHeader", () => {
    it("reproduces the official ONDC signing guide example exactly", async () => {
        const result = await fromVector();
        expect(result.digestBase64).toBe(TEST_VECTOR.expectedDigest);
        expect(result.signatureBase64).toBe(TEST_VECTOR.expectedSignature);
        expect(result.publicKey).toBe(TEST_VECTOR.publicKey);
        expect(result.header).toBe(
            `Signature keyId="example-bap.com|bap1234|ed25519",algorithm="ed25519",created="1641287875",` +
                `expires="1641291475",headers="(created) (expires) digest",signature="${TEST_VECTOR.expectedSignature}"`
        );
    });

    it("uses the ONDC signing string format (digest: BLAKE-512=)", async () => {
        const { signingString } = await buildSigningString(
            TEST_VECTOR.payload,
            TEST_VECTOR.created,
            TEST_VECTOR.created + TEST_VECTOR.ttl
        );
        expect(signingString).toBe(
            `(created): 1641287875\n(expires): 1641291475\ndigest: BLAKE-512=${TEST_VECTOR.expectedDigest}`
        );
    });

    it("produces headers the ONDC SDK's own isHeaderValid accepts", async () => {
        const { header } = await fromVector();
        await expect(
            isHeaderValid({
                header,
                body: TEST_VECTOR.payload,
                publicKey: TEST_VECTOR.publicKey,
            })
        ).resolves.toBe(true);
    });

    it("accepts a 32-byte seed and signs identically", async () => {
        const seed = Buffer.from(TEST_VECTOR.privateKey, "base64")
            .subarray(0, 32)
            .toString("base64");
        const result = await fromVector(seed);
        expect(result.signatureBase64).toBe(TEST_VECTOR.expectedSignature);
    });

    it("rejects keys of the wrong length instead of signing", async () => {
        const bad = Buffer.alloc(48, 1).toString("base64");
        await expect(normalizePrivateKey(bad)).rejects.toThrow("must be 32 or 64 bytes");
    });

    it("rejects a 64-byte key whose public half does not match", async () => {
        const bytes = Buffer.from(TEST_VECTOR.privateKey, "base64");
        bytes[63] ^= 0xff;
        await expect(normalizePrivateKey(bytes.toString("base64"))).rejects.toThrow("inconsistent");
    });

    it("generates 64-byte demo keys that sign valid headers", async () => {
        const { privateKey, publicKey } = await generateDemoKeyPair();
        expect(Buffer.from(privateKey, "base64")).toHaveLength(64);
        const { header } = await fromVector(privateKey);
        await expect(isHeaderValid({ header, body: TEST_VECTOR.payload, publicKey })).resolves.toBe(
            true
        );
    });
});

describe("verifyAuthorizationHeader", () => {
    const at = TEST_VECTOR.created;

    it("accepts the official example header", async () => {
        const { header } = await fromVector();
        const result = await verifyAuthorizationHeader(
            header,
            TEST_VECTOR.payload,
            TEST_VECTOR.publicKey,
            at
        );
        expect(result.valid).toBe(true);
    });

    it("rejects a reformatted payload", async () => {
        const { header } = await fromVector();
        const pretty = JSON.stringify(JSON.parse(TEST_VECTOR.payload), null, 2);
        const result = await verifyAuthorizationHeader(header, pretty, TEST_VECTOR.publicKey, at);
        expect(result.valid).toBe(false);
        expect(result.reason).toMatch(/Signature does not match/);
    });

    it("rejects the wrong public key", async () => {
        const { header } = await fromVector();
        const { publicKey } = await generateDemoKeyPair();
        const result = await verifyAuthorizationHeader(header, TEST_VECTOR.payload, publicKey, at);
        expect(result.valid).toBe(false);
    });

    it("rejects an expired header", async () => {
        const { header } = await fromVector();
        const result = await verifyAuthorizationHeader(
            header,
            TEST_VECTOR.payload,
            TEST_VECTOR.publicKey,
            at + 7200
        );
        expect(result.valid).toBe(false);
        expect(result.reason).toMatch(/expired/);
    });

    it("rejects a non-ed25519 algorithm", async () => {
        const { header } = await fromVector();
        const result = await verifyAuthorizationHeader(
            header.replace('algorithm="ed25519"', 'algorithm="rsa"'),
            TEST_VECTOR.payload,
            TEST_VECTOR.publicKey,
            at
        );
        expect(result.valid).toBe(false);
        expect(result.reason).toMatch(/Algorithm/);
    });
});

describe("payloadWarnings", () => {
    it("flags trailing newline, CRLF and BOM", () => {
        const ids = payloadWarnings("﻿{\r\n}\n").map((w) => w.id);
        expect(ids).toEqual(expect.arrayContaining(["bom", "crlf", "trailing-newline"]));
    });
});
