import { describe, expect, test } from "vitest";
import { parseXml, readLocationResults, readTripResults } from "../src/xml.js";

const locationXml = `<?xml version="1.0" encoding="UTF-8"?>
<trias:Trias xmlns:siri="http://www.siri.org.uk/siri" xmlns:trias="http://www.vdv.de/trias" version="1.2">
  <trias:ServiceDelivery>
    <siri:Status>true</siri:Status>
    <trias:DeliveryPayload>
      <trias:LocationInformationResponse>
        <trias:LocationResult>
          <trias:Location>
            <trias:StopPoint>
              <trias:StopPointRef>de:08212:90</trias:StopPointRef>
              <trias:StopPointName>
                <trias:Text>Hauptbahnhof</trias:Text>
                <trias:Language>de</trias:Language>
              </trias:StopPointName>
              <trias:LocalityRef>8212000:15</trias:LocalityRef>
            </trias:StopPoint>
            <trias:LocationName>
              <trias:Text>Karlsruhe</trias:Text>
              <trias:Language>de</trias:Language>
            </trias:LocationName>
            <trias:GeoPosition>
              <trias:Longitude>8.40104</trias:Longitude>
              <trias:Latitude>48.99335</trias:Latitude>
            </trias:GeoPosition>
          </trias:Location>
          <trias:Complete>true</trias:Complete>
          <trias:Probability>0.876999974</trias:Probability>
        </trias:LocationResult>
      </trias:LocationInformationResponse>
    </trias:DeliveryPayload>
  </trias:ServiceDelivery>
</trias:Trias>`;

const tripXml = `<?xml version="1.0" encoding="UTF-8"?>
<trias:Trias xmlns:siri="http://www.siri.org.uk/siri" xmlns:trias="http://www.vdv.de/trias" version="1.2">
  <trias:ServiceDelivery>
    <siri:Status>true</siri:Status>
    <trias:DeliveryPayload>
      <trias:TripResponse>
        <trias:TripResult>
          <trias:ResultId>trip-1</trias:ResultId>
          <trias:Trip>
            <trias:TripId>trip-1</trias:TripId>
            <trias:Duration>PT6M</trias:Duration>
            <trias:StartTime>2026-03-20T20:12:30Z</trias:StartTime>
            <trias:EndTime>2026-03-20T20:18:24Z</trias:EndTime>
            <trias:Interchanges>0</trias:Interchanges>
            <trias:Distance>1862</trias:Distance>
            <trias:TripLeg>
              <trias:TimedLeg>
                <trias:LegBoard>
                  <trias:StopPointRef>de:08212:89:4:2</trias:StopPointRef>
                  <trias:StopPointName>
                    <trias:Text>Karlsruhe Hauptbahnhof (Vorplatz)</trias:Text>
                  </trias:StopPointName>
                  <trias:ServiceDeparture>
                    <trias:TimetabledTime>2026-03-20T20:12:30Z</trias:TimetabledTime>
                    <trias:EstimatedTime>2026-03-20T20:12:30Z</trias:EstimatedTime>
                  </trias:ServiceDeparture>
                  <trias:StopSeqNumber>1</trias:StopSeqNumber>
                </trias:LegBoard>
                <trias:LegAlight>
                  <trias:StopPointRef>de:08212:1011:4:4</trias:StopPointRef>
                  <trias:StopPointName>
                    <trias:Text>KA Marktplatz (Pyramide U)</trias:Text>
                  </trias:StopPointName>
                  <trias:ServiceArrival>
                    <trias:TimetabledTime>2026-03-20T20:18:24Z</trias:TimetabledTime>
                    <trias:EstimatedTime>2026-03-20T20:18:24Z</trias:EstimatedTime>
                  </trias:ServiceArrival>
                  <trias:StopSeqNumber>6</trias:StopSeqNumber>
                </trias:LegAlight>
                <trias:Service>
                  <trias:ServiceSection>
                    <trias:Mode>
                      <trias:PtMode>tram</trias:PtMode>
                    </trias:Mode>
                    <trias:PublishedLineName>
                      <trias:Text>2</trias:Text>
                    </trias:PublishedLineName>
                    <trias:OperatorRef>kvv:02</trias:OperatorRef>
                    <trias:RouteDescription>
                      <trias:Text>Siemensallee - Wolfartsweier</trias:Text>
                    </trias:RouteDescription>
                  </trias:ServiceSection>
                </trias:Service>
              </trias:TimedLeg>
            </trias:TripLeg>
            <trias:TripLeg>
              <trias:ContinuousLeg>
                <trias:LegStart>
                  <trias:StopPointRef>de:08212:90</trias:StopPointRef>
                  <trias:LocationName>
                    <trias:Text>Karlsruhe, Hauptbahnhof</trias:Text>
                  </trias:LocationName>
                </trias:LegStart>
                <trias:LegEnd>
                  <trias:StopPointRef>de:08212:1011</trias:StopPointRef>
                  <trias:LocationName>
                    <trias:Text>Karlsruhe, Marktplatz (Pyramide U)</trias:Text>
                  </trias:LocationName>
                </trias:LegEnd>
                <trias:Service>
                  <trias:IndividualMode>walk</trias:IndividualMode>
                </trias:Service>
                <trias:Duration>PT29M</trias:Duration>
                <trias:Length>1989</trias:Length>
              </trias:ContinuousLeg>
            </trias:TripLeg>
          </trias:Trip>
        </trias:TripResult>
      </trias:TripResponse>
    </trias:DeliveryPayload>
  </trias:ServiceDelivery>
</trias:Trias>`;

describe("response parsers", () => {
  test("normalizes location information responses", () => {
    const parsed = parseXml(locationXml);
    const results = readLocationResults(parsed);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: "de:08212:90",
      type: "stopPoint",
      name: "Karlsruhe",
      locality: "8212000:15",
      latitude: 48.99335,
      longitude: 8.40104,
      complete: true,
    });
  });

  test("normalizes trip responses", () => {
    const parsed = parseXml(tripXml);
    const results = readTripResults(parsed);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      tripId: "trip-1",
      duration: "PT6M",
      interchanges: 0,
      distance: 1862,
    });
    expect(results[0]?.legs[0]).toMatchObject({
      kind: "timed",
      line: "2",
      mode: "tram",
      operatorRef: "kvv:02",
    });
    expect(results[0]?.legs[1]).toMatchObject({
      kind: "continuous",
      mode: "walk",
      duration: "PT29M",
      length: 1989,
    });
  });
});
