import { createClient } from 'redis';
import bodyParser from 'body-parser';
import pc  from 'picocolors';
import http from 'http';
import express from 'express'
const app = express()
app.disable('x-powered-by');

const PORT = process.env.PORT ?? 5000;

/*const client = createClient({
    url: "redis://db-redis:6379" 
});*/

const client = createClient();

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

// #region GETS
app.get('/', (req, res) => {
    res.status(200).send("hola mundo")
})

app.get('/personajes', async (req,res) =>{
        await client.connect();
        const value = await client.LRANGE("LStarWars", 0, -1);
        console.log(pc.bgGreen(value));
        await client.disconnect();
        res.status(200).json(value);    
})


app.get('/episodio/:episodio/personajes', async (req,res) =>{
    const {episodio} = req.params;
    try {
        await client.connect();
        let value
        if(episodio == "I" || episodio == "II" || episodio == "III" 
        || episodio == "IV" || episodio == "V" || episodio == "VI" 
        || episodio == "VII" || episodio == "VIII" || episodio == "IX"){
            if(await client.EXISTS('SW_Episodio'+episodio)){
                value = await client.LRANGE('SW_Episodio'+episodio, 0, -1);
                console.log(pc.cyan(episodio));
                console.log(pc.green(value));
            }else{
                value = "Sin personajes";
                console.log(pc.red(`Se proporcionó un episodio incorrecto = ${"SW_Episodio"+episodio}`));
            }
        }else{
            value = "Capítulo incorrecto";
            console.log(pc.red(`Se proporcionó un episodio incorrecto = ${"SW_Episodio"+episodio}`));
        }
        
        await client.disconnect();
        
        res.status(200).send(JSON.stringify(value));
    } catch (error) {
        res.status(404).send("error");
    }
    

})

// #region POST
app.post('/personaje/nuevo', async(req,res) =>{
    const {
        episodio,
        personaje
    } = req.body;
    console.log(req.body);
    console.log(episodio);
    console.log(typeof personaje);
    await client.connect();
    let value
    if (personaje == '' || personaje == null){
        console.log(pc.red("personaje nulo"));
        res.status(401).send(`<h1>error 401</h1>`)
        await client.disconnect();
        return;
    }
    if(episodio == "I" || episodio == "II" || episodio == "III" 
    || episodio == "IV" || episodio == "V" || episodio == "VI" 
    || episodio == "VII" || episodio == "VIII" || episodio == "IX"){
        value = await client.LPUSH('SW_Episodio'+episodio, personaje.toString());
        console.log(pc.bgGreen(value + `episodio: ${episodio} -- personaje: ${personaje}`));
        res.status(201).json(value);
    }else{
        value = "Episodio inexistente";
        console.log(pc.red(`Se proporcionó un episodio incorrecto = ${"SW_Episodio"+episodio}`));
        res.status(401).send(`<h1>error 401</h1>`);
    }
    
    await client.disconnect();

})

// #region DELETE
app.delete('/personaje/quitar', async (req,res) =>{
    const {
        episodio,
        personaje
    } = req.body

    await client.connect();
    let value
    if (personaje == '' || personaje == null){
        console.log(pc.red("personaje nulo"));
        res.status(401).send(`<h1>error 401</h1>`)
        await client.disconnect();
        return;
    }
    if(episodio == "I" || episodio == "II" || episodio == "III" 
    || episodio == "IV" || episodio == "V" || episodio == "VI" 
    || episodio == "VII" || episodio == "VIII" || episodio == "IX"){
        value = await client.LREM('SW_Episodio'+episodio, 0, personaje.toString());
        console.log(pc.green(value + `episodio: ${episodio} -- personaje: ${personaje}`));
        res.send("personaje eliminado del capítulo");
    }else{
        value = "Episodio inexistente";
        console.log(pc.red(`Se proporcionó un episodio incorrecto = ${"SW_Episodio"+episodio}`));
        res.sendStatus(400);
    }
    
    await client.disconnect();

})

app.use((req, res) => {
    res.status(404).send('<h1> error 404 </h1>');
})
app.listen(PORT, () => {
    console.log(pc.cyan(`server listening port: http://localhost:${PORT}`));
    console.log(pc.bgCyan("=================")+pc.cyan(" INICIADO ")+pc.bgCyan("================="));
})
