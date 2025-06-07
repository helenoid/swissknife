"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.AppError = void 0;
/**
 * Application Error class for standardized error handling
 */
var AppError = /** @class */ (function (_super) {
    __extends(AppError, _super);
    function AppError(code, message, options) {
        var _newTarget = this.constructor;
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.data = options === null || options === void 0 ? void 0 : options.data;
        _this.category = options === null || options === void 0 ? void 0 : options.category;
        _this.statusCode = options === null || options === void 0 ? void 0 : options.statusCode;
        // Support error cause chaining
        if (options === null || options === void 0 ? void 0 : options.cause) {
            _this.cause = options.cause;
        }
        // Ensure the error stack is properly maintained
        if (Error.captureStackTrace) {
            Error.captureStackTrace(_this, _this.constructor);
        }
        // Ensure instanceof works correctly
        Object.setPrototypeOf(_this, _newTarget.prototype);
        _this.name = _this.constructor.name;
        return _this;
    }
    // Allow serializing the error
    AppError.prototype.toJSON = function () {
        return {
            code: this.code,
            message: this.message,
            data: this.data,
            category: this.category,
            statusCode: this.statusCode,
            stack: this.stack
        };
    };
    return AppError;
}(Error));
exports.AppError = AppError;
