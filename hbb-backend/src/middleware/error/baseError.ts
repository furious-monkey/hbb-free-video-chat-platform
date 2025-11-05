const STATUS_CODES = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORISED: 401,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
};

class BaseError extends Error {
    public readonly log: string;
    public readonly methodName?: string;
    public readonly statusCode: number;
    public readonly data: any;
    public readonly isOperational: boolean;

    constructor(
        log: string,
        message: string,
        methodName?: string,
        statusCode = STATUS_CODES.INTERNAL_ERROR,
        data = {},
        isOperational = true
    ) {
        super(<string>message);
        Object.setPrototypeOf(this, new.target.prototype);

        this.log = log;
        if (methodName) this.methodName = methodName;
        this.statusCode = statusCode;
        this.data = data;
        this.isOperational = isOperational;

        Error.captureStackTrace(this);
    }
}

export { BaseError, STATUS_CODES };
