# trias-js

TypeScript client for TRIAS 1.2 passenger information endpoints.

This library is built for real TRIAS 1.2 deployments such as EFA/KVV-style endpoints. It provides:

- typed helpers for `LocationInformationRequest` and `TripRequest`
- generic support for all TRIAS 1.2 service and subscription request families
- XML request building and XML response parsing
- structured HTTP and parse errors
- ESM output built with `tsdown`
- tests with `vitest`

## Status

`trias-js` is currently focused on TRIAS `1.2` only.

This is deliberate. Real deployments often reject newer schema versions even when the documentation or XSD set suggests otherwise.

## Install

```bash
npm install trias-js
```

## Quick Start

```ts
import { TriasClient } from "trias-js";

const client = new TriasClient({
  endpoint: "https://projekte.kvv-efa.de/severtrias/trias",
  requestorRef: "YOUR_REQUESTOR_REF",
  language: "de",
});

const locations = await client.locationInformation({
  locationName: "Karlsruhe Hauptbahnhof",
  types: ["stop"],
  numberOfResults: 5,
});

console.log(locations.results);
```

## Trip Example

```ts
import { TriasClient } from "trias-js";

const client = new TriasClient({
  endpoint: "https://projekte.kvv-efa.de/severtrias/trias",
  requestorRef: "YOUR_REQUESTOR_REF",
});

const trips = await client.trip({
  origin: {
    type: "stopPoint",
    ref: "de:08212:90",
    name: "Karlsruhe Hauptbahnhof",
  },
  destination: {
    type: "stopPoint",
    ref: "de:08212:1011",
    name: "KA Marktplatz (Pyramide U)",
  },
  departureTime: "2026-03-20T21:10:00+01:00",
  numberOfResults: 3,
  includeIntermediateStops: true,
});

console.log(trips.trips);
```

## Generic Endpoint Support

Every TRIAS 1.2 request family can be sent through the generic API.

```ts
import { TriasClient } from "trias-js";

const client = new TriasClient({
  endpoint: "https://example.com/trias",
  requestorRef: "YOUR_REQUESTOR_REF",
});

const rawResponse = await client.request("StopEventRequest", {
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
});

console.log(rawResponse.parsed);
```

Supported constants:

- `TRIAS_SERVICE_REQUESTS`
- `TRIAS_SUBSCRIPTION_REQUESTS`
- `TRIAS_VERSIONS`

## API

### `new TriasClient(options)`

Options:

- `endpoint`: TRIAS HTTP endpoint
- `requestorRef`: requestor reference sent as `siri:RequestorRef`
- `language`: optional TRIAS language preference
- `timeoutMs`: request timeout, default `15000`
- `fetch`: optional custom fetch implementation
- `headers`: optional extra headers

### High-level methods

- `locationInformation(request)`
- `trip(request)`
- `raw(xml)`

### Generic methods

- `request(requestName, body)`
- `subscribe(requestName, body)`
- `requestGeneric({ requestName, body })`
- `buildGenericServiceRequest(requestName, body, requestTimestamp?)`
- `buildGenericSubscriptionRequest(requestName, body, requestTimestamp?)`

## Error Handling

The library exposes:

- `TriasError`
- `TriasHttpError`
- `TriasParseError`

`TriasHttpError` includes the HTTP status code, request XML, and response body.

## Development

```bash
npm install
npm run check
npm test
npm run build
```

## Notes

- This repo includes the TRIAS XSD materials under [`TRIAS-main`](./TRIAS-main) for local reference while developing the client.
- Public repositories should never commit real endpoint credentials. Use `.env.example` as a template only.

## License

MIT
