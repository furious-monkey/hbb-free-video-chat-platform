import { logger } from "../../config/logger";
import bunyan from "bunyan";
import { BaseError } from "./baseError";
import { APIError } from "./appError";

export class ErrorHandler {
  logger: bunyan;

  constructor(logger: bunyan) {
    this.logger = logger;
  }

  public async handleError(error: Error): Promise<void> {
    logger.error(error);
  }

  public isTrustedError(error: Error) {
    if (error instanceof BaseError && error.isOperational) {
      return true;
    } else return error instanceof APIError && error.isOperational;
  }
}
