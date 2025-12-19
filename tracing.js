// tracing.js - OpenTelemetry bootstrap for the Reg System app
/*
  Usage: node -r ./tracing.js index.js
  Environment variables:
    OTEL_SERVICE_NAME - service name for traces (default: reg-system)
    OTEL_EXPORTER_OTLP_ENDPOINT - OTLP HTTP endpoint (optional)
    OTEL_CONSOLE_EXPORTER - if set to "true", also prints spans to console
*/
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { ConsoleSpanExporter, SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');

const serviceName = process.env.OTEL_SERVICE_NAME || 'reg-system';
const otelEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || '';
const useConsole = (process.env.OTEL_CONSOLE_EXPORTER || 'true') === 'true';

const exporters = [];
if (otelEndpoint) {
  exporters.push(new OTLPTraceExporter({ url: otelEndpoint }));
}
if (useConsole) {
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
