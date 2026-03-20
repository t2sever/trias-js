import { TriasHttpError, TriasParseError } from "./errors.js";
import type {
  GenericTriasRequest,
  LocationInformationRequest,
  LocationInformationResponse,
  RawTriasResponse,
  TriasServiceRequestName,
  TriasSubscriptionRequestName,
  TripRequest,
  TripResponse,
  TriasClientOptions,
} from "./types.js";
import {
  buildGenericPayload,
  buildLocationInformationPayload,
  buildServiceRequest,
  buildTripPayload,
  getStatus,
  parseXml,
  readLocationResults,
  readTripResults,
} from "./xml.js";

export class TriasClient {
  readonly endpoint: string;
  readonly requestorRef: string;
  readonly language?: string;
  readonly timeoutMs: number;
  readonly headers?: Record<string, string>;
  readonly fetchImpl: typeof fetch;

  constructor(options: TriasClientOptions) {
    if (!options.endpoint) {
      throw new Error("TriasClient requires an endpoint");
    }
    if (!options.requestorRef) {
      throw new Error("TriasClient requires a requestorRef");
    }

    this.endpoint = options.endpoint;
    this.requestorRef = options.requestorRef;
    this.language = options.language;
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.headers = options.headers;
    this.fetchImpl = options.fetch ?? fetch;
  }

  buildLocationInformationRequest(request: LocationInformationRequest, requestTimestamp?: Date | string): string {
    return buildServiceRequest(buildLocationInformationPayload(request, this.language), {
      requestorRef: this.requestorRef,
      language: this.language,
      requestTimestamp,
    });
  }

  buildTripRequest(request: TripRequest, requestTimestamp?: Date | string): string {
    return buildServiceRequest(buildTripPayload(request, this.language), {
      requestorRef: this.requestorRef,
      language: this.language,
      requestTimestamp,
    });
  }

  buildGenericServiceRequest<TBody extends Record<string, unknown>>(
    requestName: TriasServiceRequestName | string,
    body: TBody,
    requestTimestamp?: Date | string,
  ): string {
    return buildServiceRequest(buildGenericPayload(requestName, body), {
      requestorRef: this.requestorRef,
      language: this.language,
      requestTimestamp,
      envelope: "ServiceRequest",
    });
  }

  buildGenericSubscriptionRequest<TBody extends Record<string, unknown>>(
    requestName: TriasSubscriptionRequestName | string,
    body: TBody,
    requestTimestamp?: Date | string,
  ): string {
    return buildServiceRequest(buildGenericPayload(requestName, body), {
      requestorRef: this.requestorRef,
      language: this.language,
      requestTimestamp,
      envelope: "SubscriptionRequest",
    });
  }

  async raw(xml: string): Promise<RawTriasResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(this.endpoint, {
        method: "POST",
        headers: {
          "content-type": "text/xml; charset=utf-8",
          accept: "text/xml, application/xml",
          ...this.headers,
        },
        body: xml,
        signal: controller.signal,
      });

      const body = await response.text();
      if (!response.ok) {
        throw new TriasHttpError(`TRIAS endpoint returned HTTP ${response.status}`, {
          statusCode: response.status,
          responseBody: body,
          requestXml: xml,
        });
      }

      try {
        const parsed = parseXml(body);
        return {
          status: getStatus(parsed),
          parsed,
          xml: body,
        };
      } catch (error) {
        throw new TriasParseError(
          error instanceof Error ? error.message : "Failed to parse TRIAS response",
          body,
        );
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  async locationInformation(request: LocationInformationRequest): Promise<LocationInformationResponse> {
    const xml = this.buildLocationInformationRequest(request);
    const raw = await this.raw(xml);

    return {
      status: raw.status,
      results: readLocationResults(raw.parsed),
      raw: raw.parsed,
    };
  }

  async trip(request: TripRequest): Promise<TripResponse> {
    const xml = this.buildTripRequest(request);
    const raw = await this.raw(xml);

    return {
      status: raw.status,
      trips: readTripResults(raw.parsed),
      raw: raw.parsed,
    };
  }

  async request<TParsed = unknown, TBody extends Record<string, unknown> = Record<string, unknown>>(
    requestName: TriasServiceRequestName | string,
    body: TBody,
  ): Promise<RawTriasResponse<TParsed>> {
    const xml = this.buildGenericServiceRequest(requestName, body);
    return (await this.raw(xml)) as RawTriasResponse<TParsed>;
  }

  async subscribe<TParsed = unknown, TBody extends Record<string, unknown> = Record<string, unknown>>(
    requestName: TriasSubscriptionRequestName | string,
    body: TBody,
  ): Promise<RawTriasResponse<TParsed>> {
    const xml = this.buildGenericSubscriptionRequest(requestName, body);
    return (await this.raw(xml)) as RawTriasResponse<TParsed>;
  }

  async requestGeneric<TParsed = unknown>(
    request: GenericTriasRequest,
  ): Promise<RawTriasResponse<TParsed>> {
    return this.request<TParsed>(request.requestName, request.body);
  }
}
