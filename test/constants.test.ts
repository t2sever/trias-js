import { describe, expect, test } from "vitest";
import {
  TRIAS_SERVICE_REQUESTS,
  TRIAS_SUBSCRIPTION_REQUESTS,
  TRIAS_VERSIONS,
} from "../src/index.js";

describe("exported TRIAS metadata", () => {
  test("exports only the supported TRIAS version", () => {
    expect(TRIAS_VERSIONS).toEqual(["1.2"]);
  });

  test("exports service request families", () => {
    expect(TRIAS_SERVICE_REQUESTS).toContain("LocationInformationRequest");
    expect(TRIAS_SERVICE_REQUESTS).toContain("TripRequest");
    expect(TRIAS_SERVICE_REQUESTS).toContain("StopEventRequest");
    expect(TRIAS_SERVICE_REQUESTS).toContain("TripInfoRequest");
  });

  test("exports subscription request families", () => {
    expect(TRIAS_SUBSCRIPTION_REQUESTS).toContain("TripMonitoringSubscriptionRequest");
    expect(TRIAS_SUBSCRIPTION_REQUESTS).toContain("SituationExchangeSubscriptionRequest");
  });
});
