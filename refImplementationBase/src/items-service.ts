// Las dos líneas siguientes son para incializar Open Telemetry:
import init from './tracer';
const { meter, tracer } = init('items-service', 8081);

import * as api from '@opentelemetry/api'; //Esta es la API de OpenTelemetry
import axios from 'axios';
import * as express from 'express';
//Comento hoy 20/12 las siguientes dos líneas: 
import * as Redis from 'ioredis';
const redis = new Redis();

//Comento hoy 20/12 las siguientes dos líneas: 
//import * as WebSocket from 'ws';
//const ws = new WebSocket('ws://localhost:8092');


const app = express();
const httpCounter = meter.createCounter('http_calls');

app.use((request, response, next) => {
    httpCounter.add(1);
    next();
});
// Comento hoy 20/12 las siguientes dos líneas: 
//app.get('/ws', (req, res) => {
//    const payload = { msg: 'Hi over ws' };
    // const wsSpan = tracer.startSpan('send ws message', {})
    // api.propagation.inject(api.trace.setSpan(api.context.active(), wsSpan), payload);
    // wsSpan.setAttribute('payload',JSON.stringify(payload))
// Comento hoy 20/12 la siguiente línea: 
//    ws.send(JSON.stringify(payload));
    // wsSpan.end();
// Comento hoy 20/12 las siguientes dos línea: 
//    res.json({ ws: true })
//})

app.get('/data', async (request, response) => {
    try {
        if (request.query['fail']) {
            throw new Error('A really bad error :/')
        }
        const user = await axios.get('http://localhost:8090/user');
        response.json(user.data);
    } catch (e) {
        const activeSpan = api.trace.getSpan(api.context.active());
        console.error(`Critical error`, { traceId: activeSpan.spanContext().traceId }); //Esta línea me permite asociar un span a un traceId
        activeSpan.recordException(e);
        response.sendStatus(500);
    }
})

// Comento hoy 20/12 la app.get /pub:
app.get('/pub', (request, response) => {
    const activeSpan = api.trace.getSpan(api.context.active()); //Esta línea me permite tomar el "Active Span"

    let payload = {
        message: 'this-is-my-message'
    };
    api.propagation.inject(api.trace.setSpan(api.context.active(), activeSpan), payload); //"Esta línea me permite extraer el "context" 
                                                                                          //del Span para poder propagarlo

    redis.publish('my-channel', JSON.stringify(payload));
    response.sendStatus(200);
})

app.listen(8080);
console.log('items services is up and running on port 8080');


