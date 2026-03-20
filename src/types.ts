export type TriasVersion = "1.2";

export const TRIAS_VERSIONS = ["1.2"] as const;

export const TRIAS_SERVICE_REQUESTS = [
  "AvailabilityRequest",
  "BookingInfoRequest",
  "BookingRequest",
  "BookingCancellationRequest",
  "BookingUpdateRequest",
  "ConnectionDemandRequest",
  "ConnectionDemandDeleteRequest",
  "ConnectionReportRequest",
  "ConnectionStatusRequest",
  "FacilityRequest",
  "FacilityStatusReport",
  "FaresRequest",
  "GeoCoordinatesRequest",
  "ImageCoordinatesRequest",
  "IndividualRouteRequest",
  "LocationInformationRequest",
  "MapServiceRequest",
  "PersonalisationRequest",
  "PositioningRequest",
  "RefineRequest",
  "ServiceRegisterRequest",
  "StopEventRequest",
  "TripInfoRequest",
  "TripRequest",
  "VehicleDataRequest",
  "VehicleInteractionRequest",
] as const;

export const TRIAS_SUBSCRIPTION_REQUESTS = [
  "SituationExchangeSubscriptionRequest",
  "FacilityMonitoringSubscriptionRequest",
  "TripMonitoringSubscriptionRequest",
  "ConnectionProtectionSubscriptionRequest",
] as const;

export type TriasServiceRequestName = (typeof TRIAS_SERVICE_REQUESTS)[number];
export type TriasSubscriptionRequestName = (typeof TRIAS_SUBSCRIPTION_REQUESTS)[number];

export interface GenericTriasRequest<TBody extends Record<string, unknown> = Record<string, unknown>> {
  requestName: string;
  body: TBody;
}

export interface TriasClientOptions {
  endpoint: string;
  requestorRef: string;
  language?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
}

export type LocationRef =
  | { type: "stopPoint"; ref: string; name?: string }
  | { type: "stopPlace"; ref: string; name?: string }
  | { type: "address"; ref: string; name?: string }
  | { type: "poi"; ref: string; name?: string }
  | { type: "locality"; ref: string; name?: string }
  | { type: "geo"; latitude: number; longitude: number; name?: string };

export type LocationInformationType =
  | "stop"
  | "address"
  | "poi"
  | "coord"
  | "locality";

export interface LocationInformationRequest {
  locationName?: string;
  locationRef?: LocationRef;
  types?: LocationInformationType[];
  numberOfResults?: number;
  includePtModes?: boolean;
  continueAt?: number;
}

export interface InternationalText {
  text: string;
  language?: string;
}

export interface NormalizedLocationResult {
  id?: string;
  type: "stopPoint" | "stopPlace" | "address" | "poi" | "locality" | "coord" | "unknown";
  name?: string;
  locality?: string;
  latitude?: number;
  longitude?: number;
  complete?: boolean;
  probability?: number;
  raw: unknown;
}

export interface LocationInformationResponse {
  status: boolean;
  results: NormalizedLocationResult[];
  raw: unknown;
}

export interface TripRequest {
  origin: LocationRef;
  destination: LocationRef;
  via?: LocationRef[];
  departureTime?: string | Date;
  arrivalTime?: string | Date;
  numberOfResults?: number;
  includeIntermediateStops?: boolean;
  includeFares?: boolean;
  includeOperatingDays?: boolean;
  interchangeLimit?: number;
  ignoreRealtimeData?: boolean;
  immediateTripStart?: boolean;
}

export interface TripStopCall {
  stopPointRef?: string;
  stopPointName?: string;
  plannedBay?: string;
  timetabledTime?: string;
  estimatedTime?: string;
  stopSeqNumber?: number;
}

export interface TimedLeg {
  kind: "timed";
  line?: string;
  mode?: string;
  operatorRef?: string;
  routeDescription?: string;
  origin?: TripStopCall;
  destination?: TripStopCall;
  intermediates: TripStopCall[];
  raw: unknown;
}

export interface ContinuousLeg {
  kind: "continuous";
  mode?: string;
  start?: { ref?: string; name?: string };
  end?: { ref?: string; name?: string };
  duration?: string;
  length?: number;
  raw: unknown;
}

export type TripLeg = TimedLeg | ContinuousLeg;

export interface NormalizedTripResult {
  tripId?: string;
  duration?: string;
  startTime?: string;
  endTime?: string;
  interchanges?: number;
  distance?: number;
  legs: TripLeg[];
  raw: unknown;
}

export interface TripResponse {
  status: boolean;
  trips: NormalizedTripResult[];
  raw: unknown;
}

export interface RawTriasResponse<TParsed = unknown> {
  status: boolean;
  parsed: TParsed;
  xml: string;
}
