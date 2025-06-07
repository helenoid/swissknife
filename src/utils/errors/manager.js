"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.ErrorManager = void 0;
var app_error_1 = require("./app-error");
var ErrorManager = /** @class */ (function () {
    function ErrorManager() {
        this.handlers = new Map();
        this.fallbackHandler = null;
        this.reporter = null;
        this.batchReporter = null;
        this.batchedErrors = [];
        this.batchReportTimer = null;
        this.circuitStates = new Map();
        // Register default fallback handler
        this.setFallbackHandler(function (error) {
            console.error('Unhandled error:', error);
            return false; // Indicate error was not fully handled
        });
    }
    /**
     * Get the singleton instance
     */
    ErrorManager.getInstance = function () {
        if (!ErrorManager.instance) {
            ErrorManager.instance = new ErrorManager();
        }
        return ErrorManager.instance;
    };
    /**
     * Reset the singleton instance (for testing)
     */
    ErrorManager.resetInstance = function () {
        ErrorManager.instance = undefined;
    };
    /**
     * Register a handler for a specific error code
     */
    ErrorManager.prototype.registerHandler = function (errorCode, handler) {
        this.handlers.set(errorCode, handler);
    };
    /**
     * Set the fallback handler for unmatched errors
     */
    ErrorManager.prototype.setFallbackHandler = function (handler) {
        this.fallbackHandler = handler;
    };
    /**
     * Set an error reporter function
     */
    ErrorManager.prototype.setReporter = function (reporter) {
        this.reporter = reporter;
    };
    /**
     * Handle an error
     */
    ErrorManager.prototype.handleError = function (error, context) {
        return __awaiter(this, void 0, void 0, function () {
            var handled, handler, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        handled = false;
                        if (!(error instanceof app_error_1.AppError)) return [3 /*break*/, 4];
                        handler = this.handlers.get(error.code);
                        if (!handler) return [3 /*break*/, 4];
                        return [4 /*yield*/, Promise.resolve(handler(error))];
                    case 1:
                        result = _a.sent();
                        if (result) {
                            handled = true;
                        }
                        return [3 /*break*/, 4];
                    case 2:
                        _a.label = 2;
                    case 3:
                        return [3 /*break*/, 4];
                    case 4:
                        if (!(!handled && this.fallbackHandler)) return [3 /*break*/, 6];
                        return [4 /*yield*/, Promise.resolve(this.fallbackHandler(error))];
                    case 5:
                        handled = _a.sent();
                        _a.label = 6;
                    case 6:
                        if (!this.reporter) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.reportError(error, context)];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: return [2 /*return*/, handled];
                }
            });
        });
    };
    /**
     * Report an error to the configured reporter
     */
    ErrorManager.prototype.reportError = function (error, context) {
        return __awaiter(this, void 0, void 0, function () {
            var reporterError_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.reporter)
                            return [2 /*return*/, false];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, Promise.resolve(this.reporter(error))];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        reporterError_1 = _a.sent();
                        console.error('Error in error reporter:', reporterError_1);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Add an error to the batch reporting queue
     */
    ErrorManager.prototype.queueErrorReport = function (error, context) {
        var _this = this;
        this.batchedErrors.push({ error: error, context: context });
        // Setup batch reporting if not already running
        if (!this.batchReportTimer && this.reporter) {
            this.batchReportTimer = setTimeout(function () { return _this.flushErrorReports(); }, 1000);
        }
    };
    /**
     * Send all batched error reports
     */
    ErrorManager.prototype.flushErrorReports = function () {
        return __awaiter(this, void 0, void 0, function () {
            var errors, _i, errors_1, _a, error, context, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.batchReportTimer) {
                            clearTimeout(this.batchReportTimer);
                            this.batchReportTimer = null;
                        }
                        if (!this.reporter || this.batchedErrors.length === 0)
                            return [2 /*return*/];
                        errors = __spreadArray([], this.batchedErrors, true);
                        this.batchedErrors = [];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        _i = 0, errors_1 = errors;
                        _b.label = 2;
                    case 2:
                        if (!(_i < errors_1.length)) return [3 /*break*/, 5];
                        _a = errors_1[_i], error = _a.error, context = _a.context;
                        return [4 /*yield*/, this.reportError(error, context)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_1 = _b.sent();
                        console.error('Error flushing error reports:', e_1);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute a function with retry logic for recoverable errors
     */
    ErrorManager.prototype.withRetry = function (fn, options) {
        return __awaiter(this, void 0, void 0, function () {
            var maxAttempts, delayMs, _a, backoffFactor, shouldRetry, lastError, _loop_1, attempt, state_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        maxAttempts = options.maxAttempts, delayMs = options.delayMs, _a = options.backoffFactor, backoffFactor = _a === void 0 ? 2 : _a, shouldRetry = options.shouldRetry;
                        lastError = null;
                        _loop_1 = function (attempt) {
                            var _c, error_1, delay_1;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        _d.trys.push([0, 2, , 4]);
                                        _c = {};
                                        return [4 /*yield*/, fn()];
                                    case 1: return [2 /*return*/, (_c.value = _d.sent(), _c)];
                                    case 2:
                                        error_1 = _d.sent();
                                        lastError = error_1 instanceof Error ? error_1 : new Error(String(error_1));
                                        // Check if we should retry
                                        if (attempt >= maxAttempts || (shouldRetry && !shouldRetry(lastError, attempt))) {
                                            throw lastError;
                                        }
                                        delay_1 = delayMs * Math.pow(backoffFactor, attempt - 1);
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay_1); })];
                                    case 3:
                                        _d.sent();
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        };
                        attempt = 1;
                        _b.label = 1;
                    case 1:
                        if (!(attempt <= maxAttempts)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(attempt)];
                    case 2:
                        state_1 = _b.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        _b.label = 3;
                    case 3:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 4: 
                    // This should never happen because of the check above,
                    // but TypeScript needs a return statement
                    throw lastError || new Error('Unknown error in retry logic');
                }
            });
        });
    };
    /**
     * Create an AppError from a standard Error
     */
    ErrorManager.prototype.createAppError = function (error, code, options) {
        return new app_error_1.AppError(code, error.message, __assign(__assign({}, options), { cause: error }));
    };
    /**
     * Categorize an error by type and return its category
     */
    /**
     * Categorize an error by type and return its category
     */
    ErrorManager.prototype.categorizeError = function (error) {
        if (error instanceof app_error_1.AppError && error.category) {
            return error.category;
        }
        var code = error instanceof app_error_1.AppError ? error.code : '';
        if (code.startsWith('VALIDATION'))
            return 'VALIDATION';
        if (code.startsWith('AUTH'))
            return 'AUTH';
        if (code.startsWith('NETWORK'))
            return 'NETWORK';
        // Add more specific mappings if needed based on common error code patterns
        // For now, keep the broad categories from the test
        if (code.includes('CRITICAL'))
            return 'CRITICAL';
        if (code.includes('MAJOR'))
            return 'MAJOR';
        if (code.includes('MINOR'))
            return 'MINOR';
        if (error instanceof TypeError)
            return 'TYPE_ERROR';
        if (error instanceof SyntaxError)
            return 'SYNTAX_ERROR';
        if (error instanceof ReferenceError)
            return 'REFERENCE_ERROR';
        return 'UNKNOWN';
    };
    /**
     * Get severity level for an error
     */
    ErrorManager.prototype.getErrorSeverity = function (error) {
        if (error instanceof app_error_1.AppError) {
            var code = error.code || '';
            if (code.includes('CRITICAL'))
                return 3;
            if (code.includes('MAJOR'))
                return 2;
            if (code.includes('MINOR'))
                return 1;
            // For regular errors without special codes, return 0 (info level)
            return 0;
        }
        // Default to critical for standard Errors
        return 3;
    };
    /**
     * Format an error for human readability
     */
    ErrorManager.prototype.formatError = function (error) {
        var formatted = '';
        if (error instanceof app_error_1.AppError) {
            formatted += "[" + error.code + "] " + error.message;
            if (error.context || error.data) {
                formatted += " | Context: " + JSON.stringify(error.context || error.data);
            }
            if (error.cause) {
                formatted += " | Cause: " + error.cause.message;
            }
        } else {
            formatted += error.name + ": " + error.message;
            if (error.stack) {
                formatted += "\nStack: " + error.stack;
            }
        }
        return formatted;
    };
    /**
     * Batch report multiple errors
     */
    ErrorManager.prototype.batchReportErrors = function (errors) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Check for batchReporter first, then fallback to reporter
                        if (this.batchReporter) {
                            return [4 /*yield*/, Promise.resolve(this.batchReporter(errors))];
                        } else if (this.reporter) {
                            return [4 /*yield*/, Promise.resolve(this.reporter(errors))];
                        }
                        return [2 /*return*/, false];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Retry operation with exponential backoff
     */
    ErrorManager.prototype.retryOperation = function (operation, options) {
        return __awaiter(this, void 0, void 0, function () {
            var maxRetries, delay, backoffFactor, attempt, currentDelay, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        maxRetries = options.maxRetries || 3;
                        delay = options.delay || 1000;
                        backoffFactor = options.backoffFactor || 2;
                        attempt = 0;
                        _a.label = 1;
                    case 1:
                        if (!(attempt <= maxRetries)) return [3 /*break*/, 8];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 7]);
                        return [4 /*yield*/, operation()];
                    case 3:
                        result = _a.sent();
                        return [2 /*return*/, result];
                    case 4:
                        error_1 = _a.sent();
                        if (attempt === maxRetries) {
                            throw error_1;
                        }
                        currentDelay = delay * Math.pow(backoffFactor, attempt);
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, currentDelay); })];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [3 /*break*/, 7];
                    case 7:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 8: throw new Error('Max retries exceeded');
                }
            });
        });
    };
    /**
     * Circuit breaker status tracking
     */
    ErrorManager.prototype.getCircuitStatus = function (circuitName) {
        if (!this.circuitStates) {
            this.circuitStates = new Map();
        }
        var state = this.circuitStates.get(circuitName);
        return state ? state.status : 'closed';
    };
    /**
     * Execute operation with circuit breaker (alias for withCircuitBreaker)
     */
    ErrorManager.prototype.executeWithCircuitBreaker = function (circuitName, operation, options) {
        return this.withCircuitBreaker(circuitName, operation, options);
    };
    /**
     * Circuit breaker implementation
     */
    ErrorManager.prototype.withCircuitBreaker = function (circuitName, operation, options) {
        return __awaiter(this, void 0, void 0, function () {
            var failureThreshold, timeout, state, result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.circuitStates) {
                            this.circuitStates = new Map();
                        }
                        failureThreshold = (options === null || options === void 0 ? void 0 : options.failureThreshold) || 5;
                        timeout = (options === null || options === void 0 ? void 0 : options.timeout) || 60000;
                        state = this.circuitStates.get(circuitName) || {
                            status: 'closed',
                            failures: 0,
                            lastFailureTime: 0
                        };
                        // Check if circuit should be reset from open to half-open
                        if (state.status === 'open' && Date.now() - state.lastFailureTime > timeout) {
                            state.status = 'half-open';
                        }
                        // Fail fast if circuit is open
                        if (state.status === 'open') {
                            throw new Error('Circuit open');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, operation()];
                    case 2:
                        result = _a.sent();
                        // Success - reset failure count and close circuit
                        state.failures = 0;
                        state.status = 'closed';
                        this.circuitStates.set(circuitName, state);
                        return [2 /*return*/, result];
                    case 3:
                        error_2 = _a.sent();
                        // Failure - increment count and potentially open circuit
                        state.failures++;
                        state.lastFailureTime = Date.now();
                        if (state.failures >= failureThreshold) {
                            state.status = 'open';
                        }
                        this.circuitStates.set(circuitName, state);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return ErrorManager;
}());
exports.ErrorManager = ErrorManager;
