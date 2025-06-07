/**
 * Type declaration for the mock AppError class.
 */
export declare class AppError extends Error {
    code: string;
    data?: any;
    category?: string;
    statusCode?: number;
    cause?: Error | string;

    constructor(code: string, message: string, options?: {
        data?: any;
        category?: string;
        statusCode?: number;
        cause?: Error | string;
    });

    toJSON(): {
        code: string;
        message: string;
        data: any;
        category: string | undefined;
        statusCode: number | undefined;
        stack: string | undefined;
        cause: string | undefined;
    };
}
