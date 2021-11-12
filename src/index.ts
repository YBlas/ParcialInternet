import express, { Request, Response, NextFunction, response } from 'express';
import { request } from 'http';
import { MongoClient, Collection, Db } from "mongodb";
import { connectMongo } from "./functions";
import { reserva, MONGOreserva } from "./types";
import { v4 as uuidv4 } from "uuid";

//To access from terminal: curl http://localhost:6969/

//Inicio express
const app = express();

//Conexión a mongoDB
const cole = connectMongo();

//Contexto
app.set("db", cole);
let token: string = '';
app.set("token", token);


//--------------------------> Status Ok

app.get('/status', async (request: Request, response: Response) => {
    //Get day
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    const hoy: string = dd + '/' + mm + '/' + yyyy;
    response.status(200).send(`Fecha actual: ${hoy}, todo okey`);
});

//--------------------------> Sitios libres segun día

app.get('/freeseats', async (request: Request, response: Response) => {
    const db = await request.app.get("db");
    const ango = request.query.year;
    const mes = request.query.month;
    const dia = request.query.day;
    let libres: number[] = [];
    const angoN: number = +ango!;
    const mesN: number = +mes!;
    const diaN: number = +dia!;
    if (diaN > 31 || diaN < 1 || mesN < 1 || mesN > 12 || angoN < 1900 || angoN > 3000) {
        response.status(500).send("Esa fecha no está bien mozo\n\r");
    }
    for (let i: number = 1; i <= 20; i++) {
        const ocupado: reserva = await db.collection("coworking").findOne({ year: ango, month: mes, day: dia, seat: i.toString() });
        if (ocupado) console.log(`Puesto ya cogido: ${ocupado.seat}`);
        else if (!ocupado) libres.push(i);
    }
    response.status(200).send(libres!);
});

//--------------------------> Reservar

app.post('/book', async (request: Request, response: Response) => {
    const db = await request.app.get("db");
    const ango = request.query.year;
    const mes = request.query.month;
    const dia = request.query.day;
    const puesto = request.query.seat;
    const angoN: number = +ango!;
    const mesN: number = +mes!;
    const diaN: number = +dia!;
    const puestoN: number = +puesto!;
    if (diaN > 31 || diaN < 1 || mesN < 1 || mesN > 12 || angoN < 1900 || angoN > 3000 || puestoN < 1 || puestoN > 20) {
        response.status(500).send("Fecha erronea");
    }
    const ocupado: reserva = await db.collection("coworking").findOne({ year: ango, month: mes, day: dia, seat: puesto });
    if (ocupado) {
        console.log(ocupado);
        response.status(404).send("Sitio ya ocupado");
    }
    else if (!ocupado) {
        let token: string = await request.app.get("token");
        token = uuidv4();
        const reservado: MONGOreserva = {
            token: token,
            day: dia as any,
            month: mes as any,
            year: ango as any,
            seat: puesto as any
        }

        db.collection("coworking").insertOne(reservado);

        response.status(200).send(reservado);
    }
});

//--------------------------> Libera el puesto

app.post('/FREE', async (request: Request, response: Response) => {
    const db = await request.app.get("db");
    const ango = request.query.year;
    const mes = request.query.month;
    const dia = request.query.day;
    const tokenReserva = request.headers.token;
    const puesto = request.query.seat;
    const angoN: number = +ango!;
    const mesN: number = +mes!;
    const diaN: number = +dia!;
    const puestoN: number = +puesto!;
    console.log(tokenReserva);
    if (diaN > 31 || diaN < 1 || mesN < 1 || mesN > 12 || angoN < 1900 || angoN > 3000 || puestoN < 1 || puestoN > 20) {
        response.status(500).send("Fecha erronea");
    }
    const ocupado: reserva = await db.collection("coworking").findOne({ year: ango, month: mes, day: dia, token: tokenReserva });
    if (ocupado) {
        console.log(ocupado);
        db.collection("coworking").deleteOne({ token: tokenReserva });
        response.status(200).send("Sitio liberado");

    }
    else if (!ocupado) {
        response.status(404).send("Ningun sitio reservado con ese token");
    }
});

//--------------------------> Acción antes de cada request

app.use(async (req, res, next) => {
    let token: string = await req.app.get("token");
    next();
})

const port = process.env.PORT || 6969;

app.listen(port, () => {
    console.log(`Express working on port ${port}\n\r`)
});