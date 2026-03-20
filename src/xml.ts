import { XMLBuilder, XMLParser } from "fast-xml-parser";
import type {
  InternationalText,
  LocationInformationRequest,
  LocationRef,
  NormalizedLocationResult,
  NormalizedTripResult,
  TripLeg,
  TripRequest,
  TriasClientOptions,
} from "./types.js";

const builder = new XMLBuilder({
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
  format: true,
  suppressBooleanAttributes: false,
});

const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
});

export function parseXml(xml: string): unknown {
  return parser.parse(xml);
}

function isoString(value: Date | string): string {
  return typeof value === "string" ? value : value.toISOString();
}

function textNode(text: string, language?: string): { Text: string; Language?: string } {
  return language ? { Text: text, Language: language } : { Text: text };
}

function maybeArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function locationRefNode(location: LocationRef, language?: string): Record<string, unknown> {
  const locationName = location.name ? { LocationName: textNode(location.name, language) } : {};

  switch (location.type) {
    case "stopPoint":
      return { StopPointRef: location.ref, ...locationName };
    case "stopPlace":
      return { StopPlaceRef: location.ref, ...locationName };
    case "address":
      return { AddressRef: location.ref, ...locationName };
    case "poi":
      return { PointOfInterestRef: location.ref, ...locationName };
    case "locality":
      return { LocalityRef: location.ref, ...locationName };
    case "geo":
      return {
        GeoPosition: {
          Longitude: location.longitude,
          Latitude: location.latitude,
        },
        ...locationName,
      };
  }
}

export function buildServiceRequest(
  payload: Record<string, unknown>,
  options: Pick<TriasClientOptions, "requestorRef" | "language"> & {
    requestTimestamp?: Date | string;
    envelope?: "ServiceRequest" | "SubscriptionRequest";
  },
): string {
  const requestTimestamp = isoString(options.requestTimestamp ?? new Date());
  const envelope = options.envelope ?? "ServiceRequest";

  const root = {
    Trias: {
      "@_xmlns": "http://www.vdv.de/trias",
      "@_xmlns:siri": "http://www.siri.org.uk/siri",
      "@_version": "1.2",
      [envelope]: {
        "siri:RequestTimestamp": requestTimestamp,
        "siri:RequestorRef": options.requestorRef,
        ...(options.language ? { Language: options.language } : {}),
        ...(envelope === "ServiceRequest"
          ? { RequestPayload: payload }
          : payload),
      },
    },
  };

  return `<?xml version="1.0" encoding="UTF-8"?>\n${builder.build(root)}`;
}

export function buildGenericPayload<TBody extends Record<string, unknown>>(
  requestName: string,
  body: TBody,
): Record<string, unknown> {
  return {
    [requestName]: body,
  };
}

export function buildLocationInformationPayload(
  request: LocationInformationRequest,
  language?: string,
): Record<string, unknown> {
  const baseRequest: Record<string, unknown> = {};

  if (request.locationRef) {
    baseRequest.LocationRef = locationRefNode(request.locationRef, language);
  } else {
    baseRequest.InitialInput = {
      ...(request.locationName ? { LocationName: request.locationName } : {}),
    };
  }

  const restrictions: Record<string, unknown> = {};
  if (request.types && request.types.length > 0) {
    restrictions.Type = request.types;
  }
  if (request.numberOfResults !== undefined) {
    restrictions.NumberOfResults = request.numberOfResults;
  }
  if (request.includePtModes !== undefined) {
    restrictions.IncludePtModes = request.includePtModes;
  }
  if (request.continueAt !== undefined) {
    restrictions.ContinueAt = request.continueAt;
  }

  if (Object.keys(restrictions).length > 0) {
    baseRequest.Restrictions = restrictions;
  }

  return { LocationInformationRequest: baseRequest };
}

export function buildTripPayload(request: TripRequest, language?: string): Record<string, unknown> {
  const origin: Record<string, unknown> = {
    LocationRef: locationRefNode(request.origin, language),
  };
  const destination: Record<string, unknown> = {
    LocationRef: locationRefNode(request.destination, language),
  };

  if (request.departureTime) {
    origin.DepArrTime = isoString(request.departureTime);
  }
  if (request.arrivalTime) {
    destination.DepArrTime = isoString(request.arrivalTime);
  }

  const params: Record<string, unknown> = {};
  if (request.numberOfResults !== undefined) {
    params.NumberOfResults = request.numberOfResults;
  }
  if (request.includeIntermediateStops !== undefined) {
    params.IncludeIntermediateStops = request.includeIntermediateStops;
  }
  if (request.includeFares !== undefined) {
    params.IncludeFares = request.includeFares;
  }
  if (request.includeOperatingDays !== undefined) {
    params.IncludeOperatingDays = request.includeOperatingDays;
  }
  if (request.interchangeLimit !== undefined) {
    params.InterchangeLimit = request.interchangeLimit;
  }
  if (request.ignoreRealtimeData !== undefined) {
    params.IgnoreRealtimeData = request.ignoreRealtimeData;
  }
  if (request.immediateTripStart !== undefined) {
    params.ImmediateTripStart = request.immediateTripStart;
  }

  const tripRequest: Record<string, unknown> = {
    Origin: origin,
    Destination: destination,
  };

  if (request.via && request.via.length > 0) {
    tripRequest.Via = request.via.map((viaLocation) => ({
      ViaPoint: locationRefNode(viaLocation, language),
    }));
  }

  if (Object.keys(params).length > 0) {
    tripRequest.Params = params;
  }

  return { TripRequest: tripRequest };
}

function readInternationalText(value: unknown): string | undefined {
  const texts = maybeArray(value as InternationalText | InternationalText[] | undefined);
  const first = texts[0];
  if (!first) {
    return undefined;
  }
  if (typeof first === "string") {
    return first;
  }

  if (typeof first.text === "string") {
    return first.text;
  }

  const upperText = (first as unknown as { Text?: unknown }).Text;
  return upperText === undefined ? undefined : String(upperText);
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.length > 0) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function getServiceDelivery(parsed: unknown): Record<string, unknown> {
  const root = parsed as { Trias?: { ServiceDelivery?: Record<string, unknown> } };
  const delivery = root.Trias?.ServiceDelivery;
  if (!delivery) {
    throw new Error("Missing Trias.ServiceDelivery in response");
  }

  return delivery;
}

export function getStatus(parsed: unknown): boolean {
  const delivery = getServiceDelivery(parsed) as { Status?: unknown };
  return delivery.Status === true || delivery.Status === "true";
}

export function readLocationResults(parsed: unknown): NormalizedLocationResult[] {
  const delivery = getServiceDelivery(parsed) as {
    DeliveryPayload?: { LocationInformationResponse?: { LocationResult?: unknown } };
  };
  const results = maybeArray(delivery.DeliveryPayload?.LocationInformationResponse?.LocationResult);

  return results.map((result) => {
    const locationResult = result as Record<string, unknown>;
    const location = (locationResult.Location ?? {}) as Record<string, unknown>;
    const stopPoint = location.StopPoint as Record<string, unknown> | undefined;
    const stopPlace = location.StopPlace as Record<string, unknown> | undefined;
    const address = location.Address as Record<string, unknown> | undefined;
    const poi = location.PointOfInterest as Record<string, unknown> | undefined;
    const locality = location.Locality as Record<string, unknown> | undefined;
    const geoPosition = location.GeoPosition as Record<string, unknown> | undefined;

    const type: NormalizedLocationResult["type"] = stopPoint
      ? "stopPoint"
      : stopPlace
        ? "stopPlace"
        : address
          ? "address"
          : poi
            ? "poi"
            : locality
              ? "locality"
              : geoPosition
                ? "coord"
                : "unknown";

    return {
      id:
        asString(stopPoint?.StopPointRef) ??
        asString(stopPlace?.StopPlaceRef) ??
        asString(address?.AddressRef) ??
        asString(poi?.PointOfInterestRef) ??
        asString(locality?.LocalityRef),
      type,
      name:
        readInternationalText(location.LocationName) ??
        readInternationalText(stopPoint?.StopPointName) ??
        readInternationalText(stopPlace?.StopPlaceName),
      locality:
        asString(stopPoint?.LocalityRef) ??
        asString(stopPlace?.LocalityRef) ??
        asString(location.LocalityRef),
      latitude: asNumber(geoPosition?.Latitude),
      longitude: asNumber(geoPosition?.Longitude),
      complete:
        typeof locationResult.Complete === "boolean"
          ? locationResult.Complete
          : locationResult.Complete === "true"
            ? true
            : locationResult.Complete === "false"
              ? false
              : undefined,
      probability: asNumber(locationResult.Probability),
      raw: result,
    };
  });
}

function parseTripStopCall(node: unknown) {
  const call = (node ?? {}) as Record<string, unknown>;
  const serviceArrival = call.ServiceArrival as Record<string, unknown> | undefined;
  const serviceDeparture = call.ServiceDeparture as Record<string, unknown> | undefined;

  return {
    stopPointRef: asString(call.StopPointRef),
    stopPointName: readInternationalText(call.StopPointName),
    plannedBay: readInternationalText(call.PlannedBay),
    timetabledTime:
      asString(serviceDeparture?.TimetabledTime) ?? asString(serviceArrival?.TimetabledTime),
    estimatedTime:
      asString(serviceDeparture?.EstimatedTime) ?? asString(serviceArrival?.EstimatedTime),
    stopSeqNumber: asNumber(call.StopSeqNumber),
  };
}

export function readTripResults(parsed: unknown): NormalizedTripResult[] {
  const delivery = getServiceDelivery(parsed) as {
    DeliveryPayload?: { TripResponse?: { TripResult?: unknown } };
  };
  const results = maybeArray(delivery.DeliveryPayload?.TripResponse?.TripResult);

  return results.map((tripResult) => {
    const result = tripResult as Record<string, unknown>;
    const trip = (result.Trip ?? {}) as Record<string, unknown>;
    const legNodes = maybeArray(trip.TripLeg);

    const legs: TripLeg[] = legNodes.map((legNode) => {
      const tripLeg = legNode as Record<string, unknown>;
      if (tripLeg.TimedLeg) {
        const timedLeg = tripLeg.TimedLeg as Record<string, unknown>;
        const service = (timedLeg.Service ?? {}) as Record<string, unknown>;
        const serviceSectionArray = maybeArray(service.ServiceSection);
        const serviceSection = (serviceSectionArray[0] ?? {}) as Record<string, unknown>;
        const mode = (serviceSection.Mode ?? {}) as Record<string, unknown>;

        return {
          kind: "timed" as const,
          line: readInternationalText(serviceSection.PublishedLineName),
          mode: asString(mode.PtMode) ?? asString(mode.IndividualMode),
          operatorRef: asString(serviceSection.OperatorRef),
          routeDescription: readInternationalText(serviceSection.RouteDescription),
          origin: parseTripStopCall(timedLeg.LegBoard),
          destination: parseTripStopCall(timedLeg.LegAlight),
          intermediates: maybeArray(timedLeg.LegIntermediates).map(parseTripStopCall),
          raw: legNode,
        };
      }

      const continuousLeg = (tripLeg.ContinuousLeg ?? {}) as Record<string, unknown>;
      const service = (continuousLeg.Service ?? {}) as Record<string, unknown>;

      return {
        kind: "continuous" as const,
        mode: asString(service.IndividualMode),
        start: {
          ref: asString((continuousLeg.LegStart as Record<string, unknown> | undefined)?.StopPointRef),
          name: readInternationalText((continuousLeg.LegStart as Record<string, unknown> | undefined)?.LocationName),
        },
        end: {
          ref: asString((continuousLeg.LegEnd as Record<string, unknown> | undefined)?.StopPointRef),
          name: readInternationalText((continuousLeg.LegEnd as Record<string, unknown> | undefined)?.LocationName),
        },
        duration: asString(continuousLeg.Duration),
        length: asNumber(continuousLeg.Length),
        raw: legNode,
      };
    });

    return {
      tripId: asString(trip.TripId) ?? asString(result.ResultId),
      duration: asString(trip.Duration),
      startTime: asString(trip.StartTime),
      endTime: asString(trip.EndTime),
      interchanges: asNumber(trip.Interchanges),
      distance: asNumber(trip.Distance),
      legs,
      raw: tripResult,
    };
  });
}
