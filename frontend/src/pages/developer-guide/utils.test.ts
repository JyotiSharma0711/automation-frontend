import { sortDocsByPreferredSequence } from "./utils";

const doc = (slug: string, label: string) => ({ slug, label, shortDescription: "" });

describe("sortDocsByPreferredSequence", () => {
    it("lists priority docs first, other docs alphabetically, and FAQs last", () => {
        const docs = [
            doc("ondc-FAQs", "FAQs"),
            doc("keys-and-encryption", "Keys & Encryption"),
            doc("registry-gateway", "Registry & Gateway"),
            doc("city-state-codes", "City & State Codes"),
            doc("about-ondc", "About ONDC"),
            doc("error-codes", "Core Error Codes"),
            doc("network-observability", "Network Observability"),
            doc("protocol", "Protocol"),
        ];

        expect(sortDocsByPreferredSequence(docs).map((d) => d.label)).toEqual([
            "About ONDC",
            "Protocol",
            "Registry & Gateway",
            "Network Observability",
            "City & State Codes",
            "Core Error Codes",
            "Keys & Encryption",
            "FAQs",
        ]);
    });
});
