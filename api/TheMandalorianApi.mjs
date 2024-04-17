import { createClient } from 'redis';
import bodyParser from 'body-parser';
import pc  from 'picocolors';
import http from 'http';
import express from 'express'
const app = express()
app.disable('x-powered-by');

const PORT = process.env.PORT ?? 5000;

const client = createClient({
    url: "redis://db-redis:6379" 
});
//const client = createClient();

app.use((req, res, next) => {
    // Permitir solicitudes desde cualquier origen
    res.setHeader('Access-Control-Allow-Origin', '*');
  
    // Permitir los métodos HTTP que se pueden utilizar en las solicitudes
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  
    // Permitir ciertos encabezados en las solicitudes
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization', 'Content-Type, ');
  
    // Permitir que las cookies se incluyan en las solicitudes (si es necesario)
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
  });

  app.options('*', (req, res) => {
    // Respondemos con éxito a las solicitudes OPTIONS
    res.status(200).end();
  });

app.use(express.json());

// #region GET
app.get('/', (req, res) => {
    try {
        res.status(200).send("The Mandalorian")
    } catch (error) {
        res.status(404).send("Error " + error)
    }
})

app.get('/capitulos', async (req,res) =>{
    try {
        await client.connect();
        
        const value = await client.LRANGE("ListCaps", 0, -1);
        console.log(value.length)
        let chapters = []
        for (let i = 0; i < value.length; i++) {
            let chapter = value[i].split(":")
            let exists = await client.EXISTS(chapter[0]);
            if (!exists)
                chapter.push("disponible");
            else{
                let chapterData = await client.GET(chapter[0]);
                chapter.push(chapterData);
                let time = await client.TTL(chapter[0]);
                chapter.push(time);
            }
            chapters.push(chapter);
        }

        await client.disconnect();
        
        res.status(200).json(chapters);    
    } catch (error) {
        res.status(404).send("error " + error);
    }
})

// #region POST
app.post('/reservar', async (req, res) =>{
    console.log(pc.magenta("stape1-Init"));
    const {
        capitulo,
    } = req.body;
    console.log(pc.magenta("stape2-connect"));
    await client.connect();
    console.log(pc.magenta("stape3-read"));
    let exists = await client.EXISTS(capitulo);
    console.log(pc.magenta("stape4-exists?"));
    if (exists){
        console.log(pc.magenta("stape5.1-disconnect"));
        await client.disconnect();
        res.send("NOT");
    }else{
        console.log(pc.magenta("stape5.2-SETEX"));
        await client.SETEX(capitulo, 240, "reservado")
        await client.disconnect();
        res.status(200).send("OK");
    }
})

app.post('/alquilar', async (req, res) =>{
    const {
        capitulo,
        precio
    } = req.body;
    await client.connect();
    let chapterCondition = await client.GET(capitulo);
    switch(chapterCondition){
        case "reservado":
            await client.SETEX(capitulo, 86400, "alquilado:"+ precio);
            await client.disconnect();
            res.status(200).send("OK");
            break;
        default:
            await client.disconnect();
            res.status(200).send("NOT");
            break;
    }
})

app.use((req, res) => {
    res.status(404).send('<h1> error 404 </h1>');
})
app.listen(PORT, () => {
    console.log(pc.cyan(`server listening port: http://localhost:${PORT}`));
    console.log(pc.bgCyan("=================")+pc.cyan(" INICIADO ")+pc.bgCyan("================="));

    generateDB().then(() =>{
        console.log(pc.bgCyan("=================")+pc.cyan(" Listo ")+pc.bgCyan("================="));
    });

    
})

let generateDB = (async() => {
    try {
        await client.connect();
        console.log("DB Connect ✅");

        await client.DEL("ListCaps");
        let caps = ["Cap1:El Mandaloriano:Temp1:$2000", "Cap2:El Niño:Temp1:$2000", "Cap3:El Pecado:$2000", "Cap4:Santuario:Temp1:$2000", 
        "Cap5:El Pistolero:Temp1:$2000", "Cap6:El Prisionero:Temp1:$2000", "Cap7:Ajuste de Cuentas:Temp1:$2000", "Cap8:Redención:Temp1:$2000", 
        "Cap9:El Comisario:Temp2:$2000", "Cap10:La Pasajera:Temp2:$2000", "Cap11:La Heredera:Temp2:$2000", "Cap12:El Asedio:Temp2:$2000", 
        "Cap13:La Jedi:Temp2:$2000", "Cap14:La Tragedia:Temp2:$2000", "Cap15:El Creyente:Temp2:$2000", "Cap16:El Rescate:Temp2:$2000", 
        "Cap17:El Apóstata:Temp3:$3000", "Cap18:Las Minas de Mandalore:Temp3:$3000", "Cap19:El Converso:Temp3:$3000", "Cap20:El Expósito:Temp3:$3000", 
        "Cap21:El Pirata:Temp3:$3000", "Cap22:Pistoleros a Sueldo:Temp3:$3000", "Cap23:Los Espías:Temp3:$3000", "Cap24:El Retorno:Temp3:$3000"]
        await client.LPUSH("ListCaps", caps);
        console.log("Data Saved ✅");

        await client.disconnect();
        console.log("DB Disconnect ✅");

    } catch (error) {
        console.log(pc.red("Error al conectar, recargar los datos, o desconectar la base de datos"))
    }
})