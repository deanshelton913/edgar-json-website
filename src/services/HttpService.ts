import { inject, injectable } from "tsyringe";
import { LoggingService } from "./LoggingService"; // Import the LoggingService

@injectable()
export class HttpService {
  private defaultProperties = {
    timeout: 3000, // 3 seconds
  } as RequestInit;

  constructor(
    @inject(LoggingService) protected loggingService: LoggingService,
  ) {}

  public setDefaultProperties(properties: RequestInit) {
    this.defaultProperties = { ...this.defaultProperties, ...properties };
  }

  public async deriveRequestId(url: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(url);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .map((b) => `00${b.toString(16)}`.slice(-2))
      .join("")
      .substring(0, 5); // Create SHA-1 hash and take the first 5 characters
  }

  public async get(url: string, options: RequestInit = this.defaultProperties) {
    // Create SHA-1 hash and take the first 5 characters
    const requestId = await this.deriveRequestId(url);
    this.loggingService.debug(`[HTTP][GET][${requestId}] > ${url}`);
    const requestOptions = {
      ...this.defaultProperties,
      ...options,
    };

    const fileResponse = await fetch(url, requestOptions);
    this.loggingService.debug(
      `[HTTP][GET][${requestId}] < ${fileResponse.status}`,
    );
    return fileResponse;
  }

  public async post(url: string, data: Record<string, unknown>, options: RequestInit = this.defaultProperties) {
    const requestId = await this.deriveRequestId(url);
    this.loggingService.debug(`[HTTP][POST][${requestId}] > ${url}`);
    const requestOptions = {
      ...this.defaultProperties,
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
    };

    const response = await fetch(url, requestOptions);
    this.loggingService.debug(
      `[HTTP][POST][${requestId}] < ${response.status}`,
    );
    return response;
  }

  public async put(url: string, data: Record<string, unknown>, options: RequestInit = this.defaultProperties) {
    const requestId = await this.deriveRequestId(url);
    this.loggingService.debug(`[HTTP][PUT][${requestId}] > ${url}`);
    const requestOptions = {
      ...this.defaultProperties,
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
    };

    const response = await fetch(url, requestOptions);
    this.loggingService.debug(
      `[HTTP][PUT][${requestId}] < ${response.status}`,
    );
    return response;
  }

  public async delete(url: string, options: RequestInit = this.defaultProperties) {
    const requestId = await this.deriveRequestId(url);
    this.loggingService.debug(`[HTTP][DELETE][${requestId}] > ${url}`);
    const requestOptions = {
      ...this.defaultProperties,
      ...options,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, requestOptions);
    this.loggingService.debug(
      `[HTTP][DELETE][${requestId}] < ${response.status}`,
    );
    return response;
  }
}
