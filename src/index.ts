import express, { Request, Response, NextFunction, response } from 'express';
import { request } from 'http';
import { MongoClient, Collection, Db } from "mongodb";
import { connectMongo } from "./functions";
import { usuario, MONGOcharacter } from "./types";

//To access from terminal: curl http://localhost:6969/

//Inicio express
const app = express();

//Conexión a mongoDB
const cole = connectMongo();

//Contexto
app.set("db", cole);
let userFinal = '';
let passFinal = '';

//--------------------------> Status Ok

app.get('/', async (request: Request, response: Response) => {
    const db = await request.app.get("db");
    const usuarios = await db.collection("Users").find().toArray();
    response.status(200).json(usuarios);
});

//--------------------------> Registrar usuario

app.put('/register', async (req: Request, res: Response) => {
    const db: Db = await req.app.get("db");
    const user = await db.collection("Users").findOne({ user: req.query.user });
    if (user != null) res.status(403).send(`There's already a user named ${req.query.user}`);
    else {
        const insertar = await db.collection("Users").insertOne({ user: req.query.user, pass: req.query.pass });
        if (insertar.insertedId) res.status(200).send(`Vimos a registar a ${req.query.user} con contraseña ${req.query.pass}`);

    }

});

//--------------------------> Iniciar sesion

app.get('/login', async (req: Request, res: Response) => {
    const db: Db = await req.app.get("db");
    const user = await db.collection("Users").findOne({ user: req.query.user }) as usuario;
    if (user == null) res.status(403).send(`There's no user with the name ${req.query.user}`);
    else {
        if (user.pass != req.query.pass) res.status(403).send(`La contraseña ${req.query.pass} es incorrecta`);
        else if (user.pass == req.query.pass) {
            userFinal = (req.query as any).user;
            passFinal = (req.query as any).pass;
            res.status(200).send(`Usario ${userFinal} y contraseña ${passFinal} correctas`);
        }
    }
});

//--------------------------> Test inicio de sesion

app.get('/testlogin', async (req: Request, res: Response) => {
    if (userFinal != '' && passFinal != '') {
        res.status(200).send(`Logeado correcto\nUser:${userFinal}\nPassword:${passFinal}`);
    } else res.status(403).send("No te has logeado chaval");
});

//--------------------------> Acceder a los personajes de Rick&Morty si estás registrado

const getCharacters = async (request: Request, response: Response) => {
    const db: Db = await request.app.get("db");
    if (userFinal != '' && passFinal != '') {
        db.collection("RickMorty").find().toArray().then((elem) => {
            let characters: MONGOcharacter[] = elem as MONGOcharacter[];
            response.status(200).json(characters);
    })
} else response.status(403).send("No te has logeado chaval");
};

app.get('/RickMorty', getCharacters);

//--------------------------> Acción antes de cada request

app.use((req, res, next)=>{
    console.log(JSON.stringify(req.headers.mosterotic));
    next();
})

const port = process.env.PORT || 6969;

app.listen(port, () => {
    console.log(`Express working on port ${port}\n\r`)
});