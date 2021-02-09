import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { WebhookClient, Suggestion } from "dialogflow-fulfillment";

admin.initializeApp();
const db = admin.firestore();

process.env.DEBUG = "dialogflow:debug"; // enables lib debugging statements

exports.fulfillment = functions.https.onRequest(
  (request, response) => {
    const agent = new WebhookClient({ request, response });
    const tematicas = ["Inteligencia Artificial", "React", "Firebase"];
    const sugerenciasEventos = ["Pláticas", "Talleres", "Platzi Live"];
    const ciudades = ["Bogotá", "Ciudad de México"];
    //const incidencias = firestore;
    const siguienteLive = {
      dia: "20 de Abril",
      hora: "7 PM",
      tema: "Mejores prácticas para DevOps"
    };
    console.log(
      "Dialogflow Request headers: " + JSON.stringify(request.headers)
    );
    console.log("Dialogflow Request body: " + JSON.stringify(request.body));

    function obtenerCiudad() {
      if (ciudades.includes(agent.parameters.ciudad)) {
        agent.add(`Genial! Te puedo ayudar a encontrar pláticas y 
	talleres en tu ciudad o eventos en línea.
	¿Por cuál te gustaría empezar?`);
        sugerenciasEventos.map(element => {
          agent.add(new Suggestion(element));
          return;
        });
      } else {
        voidMessage();
      }
    }
    function voidMessage() {
      agent.add(`Oh! aun no hay meetups en tu ciudad pero,
	siguiente platzi live es el dia ${siguienteLive.dia} a la 
	${siguienteLive.hora} y el tema es ${siguienteLive.tema}`);
    }
    function detallePlatziLive() {
      agent.add(`El siguiente platzi live es el día ${siguienteLive.dia} a la 
	${siguienteLive.hora} y el tema es ${siguienteLive.tema}`);
    }

    function seleccionDeTematica() {
      agent.add(`Super! A mi también me encantan los retos.
    Estos son los temas que se
    van a cubrir proximamente en tu ciudad: ${tematicas.join(",")}.
    ¿Cuál te interesa mas?`);
      tematicas.map(element => {
        agent.add(new Suggestion(element));
        return;
      });
    }
    function detalleDeTaller() {
      agent.add(`El sabado 20 de Mayo a las 9 AM
en las oficinas de WeWork tendremos de React Hooks. ¿Te gustaría asistir? `);
    }
    
    async function obtenerIncidencia() {
/*
      const citiesRef = db.collection('cities');
      await citiesRef.doc('SF').set({
        name: 'San Francisco', state: 'CA', country: 'USA',
        capital: false, population: 860000
      });
      await citiesRef.doc('LA').set({
        name: 'Los Angeles', state: 'CA', country: 'USA',
        capital: false, population: 3900000
      });
      await citiesRef.doc('DC').set({
        name: 'Washington, D.C.', state: null, country: 'USA',
        capital: true, population: 680000
      });
      await citiesRef.doc('TOK').set({
        name: 'Tokyo', state: null, country: 'Japan',
        capital: true, population: 9000000
      });
      await citiesRef.doc('BJ').set({
        name: 'Beijing', state: null, country: 'China',
        capital: true, population: 21500000
      });
*/
      agent.add("Holi 2");

      const cityRef = db.collection('cities').doc('SF');
      const doc = await cityRef.get();
      if (!doc.exists) {
        console.log('No such document!');
      } else {
        let doccito = doc.data() || {name: 'AVER'};
        agent.add("Document data: " + doccito['name']);  
        console.log('Document data:', doc.data());
      }
      /*if (ciudades.includes(agent.parameters.ciudad)) {
        agent.add(`Genial! Te puedo ayudar a encontrar pláticas y 
        talleres en tu ciudad o eventos en línea.
        ¿Por cuál te gustaría empezar?`);
              sugerenciasEventos.map(element => {
                agent.add(new Suggestion(element));
                return;
              });
      } else {
        voidMessage();
      }*/
    }

    const intentMap = new Map();

    //mapa relacionando el nombre del intent con la función del codigo
    intentMap.set("Obtener Ciudad", obtenerCiudad);
    intentMap.set("Live", detallePlatziLive);
    intentMap.set("Talleres", seleccionDeTematica);
    intentMap.set("Seleccion de Taller", detalleDeTaller);
    intentMap.set("Deteccion de Incidencia", obtenerIncidencia);
    agent.handleRequest(
        intentMap).then(() => console.log('handle will succeed'))
    .catch(err  => console.log('error in request'));

  }
);
