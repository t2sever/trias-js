import { describe, expect, test, vi } from "vitest";
import { TriasClient } from "../src/client.js";
import { TriasHttpError } from "../src/errors.js";

const responseXml = `<?xml version="1.0" encoding="UTF-8"?>
<trias:Trias xmlns:siri="http://www.siri.org.uk/siri" xmlns:trias="http://www.vdv.de/trias" version="1.2">
  <trias:ServiceDelivery>
    <siri:Status>true</siri:Status>
    <trias:DeliveryPayload>
      <trias:LocationInformationResponse>
        <trias:LocationResult>
          <trias:Location>
            <trias:StopPoint>
              <trias:StopPointRef>de:08212:90</trias:StopPointRef>
            </trias:StopPoint>
          </trias:Location>
          <trias:Complete>true</trias:Complete>
        </trias:LocationResult>
      </trias:LocationInformationResponse>
    </trias:DeliveryPayload>
  </trias:ServiceDelivery>
</trias:Trias>`;

describe("TriasClient", () => {
  test("sends location information requests", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(responseXml, {
        status: 200,
        headers: { "content-type": "text/xml" },
      }),
    );

    const client = new TriasClient({
      endpoint: "https://example.test/trias",
      requestorRef: "demo-ref",
      fetch: fetchMock,
    });

    const response = await client.locationInformation({
      locationName: "Karlsruhe Hauptbahnhof",
      types: ["stop"],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(init?.method).toBe("POST");
    expect(String(init?.body)).toContain("<LocationInformationRequest>");
    expect(response.status).toBe(true);
    expect(response.results[0]?.id).toBe("de:08212:90");
  });

  test("throws structured HTTP errors", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("bad request", {
        status: 400,
      }),
    );

    const client = new TriasClient({
      endpoint: "https://example.test/trias",
      requestorRef: "demo-ref",
      fetch: fetchMock,
    });

    await expect(
      client.locationInformation({
        locationName: "Karlsruhe Hauptbahnhof",
      }),
    ).rejects.toBeInstanceOf(TriasHttpError);
  });
});
