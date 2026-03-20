export class TriasError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TriasError";
  }
}

export class TriasHttpError extends TriasError {
  readonly statusCode: number;
  readonly responseBody: string;
  readonly requestXml: string;

  constructor(message: string, options: { statusCode: number; responseBody: string; requestXml: string }) {
    super(message);
    this.name = "TriasHttpError";
    this.statusCode = options.statusCode;
    this.responseBody = options.responseBody;
    this.requestXml = options.requestXml;
  }
}

export class TriasParseError extends TriasError {
  readonly xml: string;

  constructor(message: string, xml: string) {
    super(message);
    this.name = "TriasParseError";
    this.xml = xml;
  }
}
