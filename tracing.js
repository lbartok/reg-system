// tracing.js - OpenTelemetry bootstrap for the Reg System app
/*
  Usage: node -r ./tracing.js index.js
  Environment variables:
    OTEL_SERVICE_NAME - service name for traces (default: reg-system)
    OTEL_EXPORTER_OTLP_ENDPOINT - OTLP HTTP endpoint (optional)
    OTEL_CONSOLE_EXPORTER - if set to "true", also prints spans to console
*/
let NodeSDK, getNodeAutoInstrumentations, OTLPTraceExporter, ConsoleSpanExporter, SimpleSpanProcessor;
let _otelAvailable = true;
try {
  ({ NodeSDK } = require('@opentelemetry/sdk-node'));
  ({ getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node'));
  ({ OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http'));
  ({ ConsoleSpanExporter, SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base'));
} catch (e) {
  _otelAvailable = false;
  console.warn('OpenTelemetry modules not available; tracing disabled:', e.message);
  // no-op stubs so application can run without OTEL packages
  NodeSDK = class {
    constructor() {}
    start() { return Promise.resolve(); }
    shutdown() { return Promise.resolve(); }
    configureTracerProvider() { return { addSpanProcessor() {} }; }
  };
  getNodeAutoInstrumentations = () => [];
  OTLPTraceExporter = null;
  ConsoleSpanExporter = null;
  SimpleSpanProcessor = class {};
}

const serviceName = process.env.OTEL_SERVICE_NAME || 'reg-system';
const otelEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || '';
const useConsole = (process.env.OTEL_CONSOLE_EXPORTER || 'true') === 'true';

const exporters = [];
if (otelEndpoint && OTLPTraceExporter) {
  exporters.push(new OTLPTraceExporter({ url: otelEndpoint }));
}
if (useConsole && ConsoleSpanExporter) {
  exporters.push(new ConsoleSpanExporter());
}

const sdk = new NodeSDK({
  serviceName,
  traceExporter: exporters.length === 1 ? exporters[0] : undefined,
  instrumentations: [getNodeAutoInstrumentations()],
});

// If multiple exporters requested, add processors for each
if (exporters.length > 1) {
  exporters.forEach((exp) => sdk.configureTracerProvider?.().addSpanProcessor(new SimpleSpanProcessor(exp)));
}

sdk.start()
  .then(() => {
    // tracing started
    // console.log('OpenTelemetry started');
  })
  .catch((err) => console.error('Error starting OpenTelemetry', err));

process.on('SIGTERM', () => {
  sdk.shutdown().catch((err) => console.log('Error shutting down tracing', err)).finally(() => process.exit(0));
});
