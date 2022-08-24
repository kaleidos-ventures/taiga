# Logging

## Correlation ID

A Correlation ID is a unique identifier that is added to the very first interaction (incoming request) to identify the context and is passed to all components that are involved in the transaction flow. Correlation ID becomes the glue that binds the transaction together and helps to draw an overall picture of events.

Some use cases could be:

- **Log Correlation**: Log correlation is the ability to track disparate events through different parts of the application. Having a Correlation ID provides more context making it easy to build rules for reporting and analysis.
- **Secondary reporting/observer systems**: Using Correlation ID helps secondary systems to correlate data without application context. Some examples - generating metrics based on tracing data, integrating runtime/system diagnostics etc.
- **Troubleshooting Errors**: For troubleshooting an errors, Correlation ID is a great starting point to trace the workflow of a transaction.

We have a middleware (`taiga.base.logging.middlewares.CorrelationIdMiddleware`) and a contextvar (taiga.base.logging.context.correlation_id) to manager with it.

The Middleware read the correlation id from the Request Header "correlation-id" and store the value in the contexvar. We will have to use the contextvar to transmit the id to every external system, communication or to log all the traces in the system.

**How it works:**

- HTTP REQUEST: *In a request HEADER we can send a `correlation-id` with some value, `<my-correlation-id>`.*
- HTTP RESPONSES: *The response HEADER contains the `correlation-id` with the value `<my-correlation-id>` send. If there is none, a random one will be generated.*
- WS EVEMNTS: *Events generated contains `correlationId` with  the value `<my-correlation-id>` related to the request that generated them.*
- LOGGING: *__TODO__ (e.g. add in email header)*
- EMAILS: *__TODO__ (e.g. create filter and add to every trace)*
