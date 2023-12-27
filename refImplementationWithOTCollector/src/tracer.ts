import { MeterProvider } from '@opentelemetry/sdk-metrics-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor, BatchSpanProcessor, ConsoleSpanExporter, } from '@opentelemetry/sdk-trace-base';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ExpressInstrumentation, ExpressRequestHookInformation } from 'opentelemetry-instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { Span, Baggage } from '@opentelemetry/api';
import { AlwaysOnSampler, AlwaysOffSampler, ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/core';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis'
//26/12/2023 Se modifica la línea siguiente por la siguiente:
//import { serviceSyncDetector, serviceSyncDetector } from 'opentelemetry-resource-detector-service';  //
import { serviceSyncDetector } from 'opentelemetry-resource-detector-service';  //
import { CollectorTraceExporter, CollectorMetricExporter } from '@opentelemetry/exporter-collector';
import WsInstrumentation from './ws-instrumentation/ws';


const init = function (serviceName: string, metricPort: number) {

    // Define metrics
//Comento las siguientes tres líneas para implementar el Collector Gateway:
//    const metricExporter = new PrometheusExporter({ port: metricPort }, () => {
//        console.log(`scrape: http://localhost:${metricPort}${PrometheusExporter.DEFAULT_OPTIONS.endpoint}`);
//    });

//Habilito las siguientes tres líneas para implementar el Collector Gateway y exportar las métricas:
    const metricExporter = new CollectorMetricExporter({
        url: 'http://10.9.89.153:4318/v1/metrics'
    })
    const meter = new MeterProvider({ exporter: metricExporter, interval: 100000 }).getMeter(serviceName);

    // Define traces

//Comento la línea siguiente para implementar el Collector Gateway:
//    const traceExporter = new JaegerExporter({ endpoint: 'http://localhost:14268/api/traces'}); //Este es el exporter, en este caso para Jaeger

// Las dos líneas siguientes me permiten utilizar un detector:
//    const serviceResources = serviceSyncDetector.detect(); //Un detetor es una clase predeterminada que colecta datos.
//    const customResources = new Resource({'my-resource':55});

    const provider = new NodeTracerProvider({
// Si uso "detector" debo descomentar la línea siguiente:
//        resource: serviceResources.merge(customResources)
// Si uso "detector" debo comentar las siguientes tres líneas: 
        resource: new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: serviceName,'metadata':54, 'metadata2':63  //Acá podría agregar metedata.
        }),
//Habilito las siguientes tres líneas para implementar el Collector Gateway y agrego una "," en la línea de arriba: 
        sampler: new ParentBasedSampler({          
           root: new TraceIdRatioBasedSampler(1)
        })
    });
//Habilito las siguientes tres líneas para implementar el collector Gateway y exportar los traces:
    const traceExporter = new CollectorTraceExporter({
         url: 'http://10.9.89.153:4318/v1/trace'
    })
    provider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));  //toma el span y se lo pasa al exporter de Jaeger.
//    provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));  //Si habilito Esta línea me imprime en consola en forma simultanea.
    provider.register();
//La función "requestHook" me permitiriá enviar información del span activo en el header.
    registerInstrumentations({
        instrumentations: [
            new ExpressInstrumentation({
                requestHook: (span, reqInfo) => {  
                    span.setAttribute('request-headers',JSON.stringify(reqInfo.req.headers))
                }
            }),
            new HttpInstrumentation(),
//Comento hoy 20/12 las siguientes dos líneas: 
            new IORedisInstrumentation()
//            new WsInstrumentation()
        ]
    });
    const tracer = provider.getTracer(serviceName);
    return { meter, tracer };
}

export default init;