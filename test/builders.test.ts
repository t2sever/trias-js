import { describe, expect, test } from "vitest";
import { TriasClient } from "../src/client.js";

describe("request builders", () => {
  const client = new TriasClient({
    endpoint: "https://example.test/trias",
    requestorRef: "demo-ref",
    language: "de",
    fetch: fetch,
  });

  test("builds a location information request", () => {
    const xml = client.buildLocationInformationRequest(
      {
        locationName: "Karlsruhe Hauptbahnhof",
        types: ["stop"],
        numberOfResults: 5,
      },
      "2026-03-20T21:03:20+01:00",
    );

    expect(xml).toContain('version="1.2"');
    expect(xml).toContain("<siri:RequestorRef>demo-ref</siri:RequestorRef>");
    expect(xml).toContain("<LocationName>Karlsruhe Hauptbahnhof</LocationName>");
    expect(xml).toContain("<Type>stop</Type>");
    expect(xml).toContain("<NumberOfResults>5</NumberOfResults>");
  });

  test("builds a trip request with stop refs", () => {
    const xml = client.buildTripRequest(
      {
        origin: { type: "stopPoint", ref: "de:08212:90", name: "Karlsruhe Hauptbahnhof" },
        destination: { type: "stopPoint", ref: "de:08212:1011", name: "Karlsruhe Marktplatz" },
        departureTime: "2026-03-20T21:10:00+01:00",
        numberOfResults: 3,
        includeIntermediateStops: true,
      },
      "2026-03-20T21:04:45+01:00",
    );

    expect(xml).toContain("<TripRequest>");
    expect(xml).toContain("<StopPointRef>de:08212:90</StopPointRef>");
    expect(xml).toContain("<StopPointRef>de:08212:1011</StopPointRef>");
    expect(xml).toContain("<DepArrTime>2026-03-20T21:10:00+01:00</DepArrTime>");
    expect(xml).toContain("<IncludeIntermediateStops>true</IncludeIntermediateStops>");
  });

  test("builds generic service requests for arbitrary TRIAS endpoints", () => {
    const xml = client.buildGenericServiceRequest(
      "StopEventRequest",
      {
        Location: {
          LocationRef: {
            StopPointRef: "de:08212:90",
            LocationName: {
              Text: "Karlsruhe Hauptbahnhof",
              Language: "de",
            },
          },
          DepArrTime: "2026-03-20T21:10:00+01:00",
        },
      },
      "2026-03-20T21:10:00+01:00",
    );

    expect(xml).toContain("<StopEventRequest>");
    expect(xml).toContain("<StopPointRef>de:08212:90</StopPointRef>");
  });

  test("builds subscription requests", () => {
    const xml = client.buildGenericSubscriptionRequest(
      "TripMonitoringSubscriptionRequest",
      {
        SubscriptionIdentifier: "sub-1",
      },
      "2026-03-20T21:12:00+01:00",
    );

    expect(xml).toContain("<SubscriptionRequest>");
    expect(xml).toContain("<TripMonitoringSubscriptionRequest>");
    expect(xml).toContain("<SubscriptionIdentifier>sub-1</SubscriptionIdentifier>");
  });
});
