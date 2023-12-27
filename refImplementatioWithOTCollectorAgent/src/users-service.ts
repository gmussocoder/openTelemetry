import init from './tracer';
const { tracer } = init('users-services', 8091);

import * as api from '@opentelemetry/api';
import axios from 'axios';
import * as express from 'express';
const app = express();
const randomNumber = (min: number, max: number) => Math.floor(Math.random() * max + min);

// Comento hoy 20/12 Hasta la línea 18: 
//import { WebSocketServer } from 'ws';

//const wss = new WebSocketServer({ port: 8092 });

//wss.on('connection', function connection(ws) {
//    ws.on('message', function incoming(message) {
//        try{
//        const payload = JSON.parse(message?.toString());

        // // const propagatedContext = api.propagation.extract(api.ROOT_CONTEXT, payload);
        // const wsSpan = tracer.startSpan('got ws message', {
            // attributes: {
                // 'payload': message?.toString()
            // }});
        // }}, propagatedContext)
// Comento hoy 20/12 la siguiente línea:
//        console.log('received: %s', message);
        // wsSpan.end();

// Comento hoy 20/12 Hasta la línea 38:
//    } catch(e){
//        console.error(e)
//    }
//    });
//});

import * as Redis from 'ioredis';
const redis = new Redis();


app.get('/user', async (request, response) => {
    const apiResponse = await axios('https://mocki.io/v1/d4867d8b-b5d5-4a48-a4ab-79131b5809b8');
    const randomIndex = randomNumber(0, apiResponse.data.length)
    const activeSpan = api.trace.getSpan(api.context.active());
    activeSpan.addEvent('A number was randomizaed', {
        randomIndex
    })

    response.json(apiResponse.data[randomIndex]);
})

app.listen(8090);
console.log('users services is up and running on port 8090');

// Comento hoy 20/12 de acá hasta abajo de todo:
redis.subscribe('my-channel', (err, data) => {  //Este código me permite extraer el "Context" desde el payload en el servicio usuario.
    console.log(`on subscribe`);
    redis.on("message", (channel, message) => {
        const payload = JSON.parse(message);
        const propagatedContext = api.propagation.extract(api.ROOT_CONTEXT, payload);
        const span = api.trace.getTracer('@opentelemetry/instrumentation-ioredis').startSpan("consume a message", {
            attributes: {
                message,
            }
       }, propagatedContext);
        span.end();
        console.log(`Received ${message} from ${channel}`);
    });
})

//
setInterval(async () => {
    api.trace.getTracer('manual').startActiveSpan('Refesh cache', async (span) => {   
        const apiResponse = await axios('https://mocki.io/v1/d4867d8b-b5d5-4a48-a4ab-79131b5809b8');
        span.end();
    });

}, 1000)

//setInterval(async () => {
//        const span = api.trace.getTracer('manual').startSpan('Refesh cache');
//        const apiResponse = await axios('https://mocki.io/v1/d4867d8b-b5d5-4a48-a4ab-79131b5809b8');
//        span.end();

//}, 1000)