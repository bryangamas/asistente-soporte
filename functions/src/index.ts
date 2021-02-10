import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { WebhookClient, Suggestion } from "dialogflow-fulfillment";

admin.initializeApp();
const db = admin.firestore();

process.env.DEBUG = "dialogflow:debug"; // enables lib debugging statements

// Obtiene referencias a la BD
const tipoIncidenciasRef = db.collection('tipo-incidencias');
//const incidenciasRef = db.collection('incidencias');
// const incidenciasRef = db.collection('tipo-incidencias');

// Mensajes 
const msgSaludo = '¡Hola! Soy tu asistente de soporte técnico. ';
const msgDetectarIncidencia = '¿En qué puedo ayudarte?';
const msgMuestraOpcion = 'Por favor, intenta lo siguiente\n';
const msgMuestraOpciones = 'Por favor, prueba alguna de estas soluciones\n';
const msgAyudoOpcion = 'Por favor, cuéntame si resolvió tu problema.\n';
const msgAyudoOpciones = 'Por favor, cuéntame si alguna de las opciones resolvió tu problema.\n';
const msgNingunaSolucion = 'Ninguna';

exports.fulfillment = functions.https.onRequest(
  async (request, response) => {
    const agent = new WebhookClient({ request, response });
    

    function welcomeIntent() {
      agent.add(msgSaludo + msgDetectarIncidencia);
    }

    async function obtenerIncidencia() {
      const tipoIncidenciasSnapshot = await tipoIncidenciasRef.get();
      //const incidenciasSnapshot = await incidenciasRef.get();
      //agent.add("Test");
      /*
      incidenciasSnapshot.forEach((doc: any) => {
        agent.add(doc.id||"Nancy 3")
        agent.add(doc.data()['estado']||"Nancy 2")
      });
      */

      tipoIncidenciasSnapshot.forEach((doc: any) => {

        // agent.add(doc['desc']||"Nancy")
        
        if (doc.data()['desc'] == agent.parameters.incidencias) {
          let message = "";
          if (doc.data()['sol']) {
            if (doc.data()['sol'].length == 1) {
              message += msgMuestraOpcion;
              message += doc.data()['sol'][0] + '\n';
              message += msgAyudoOpcion;
              agent.add(new Suggestion("Sí"));
              agent.add(new Suggestion("No"));
            } else {
              message += msgMuestraOpciones;
              doc.data()['sol'].forEach(
                (e:any, i:any) => {
                  message += `Opción ${i + 1}: ${e} \n`;
                }
              )
              message += msgAyudoOpciones;
              doc.data()['sol'].forEach(
                (e:any, i:any) => {
                  agent.add(new Suggestion(`Opción ${i + 1}`));
                }
              )
              agent.add(new Suggestion(msgNingunaSolucion));
              
            }
          }
          agent.add(message);
        }
      }
    );

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
*/
      /*if (ciudades.includes(agent.parameters.ciudad)) {
        agent.add('Genial! Te puedo ayudar a encontrar pláticas y 
        talleres en tu ciudad o eventos en línea.
        ¿Por cuál te gustaría empezar?');
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
    intentMap.set("Default Welcome Intent", welcomeIntent);
    intentMap.set("Deteccion de Incidencia", obtenerIncidencia);
    agent.handleRequest(
        intentMap).then(() => console.log('handle will succeed'))
    .catch(err  => console.log('error in request'));

  }
);

