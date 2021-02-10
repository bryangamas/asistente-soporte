import * as functions from "firebase-functions";
import { WebhookClient, Suggestion } from "dialogflow-fulfillment";
import { UtilsBD } from './utils/utils-bd';
import { UtilsArray } from './utils/utils-array';
import { Incidencia } from './models/incidencia';

process.env.DEBUG = "dialogflow:debug"; // enables lib debugging statements

// Variables a reemplazar en los mensajes
const NUM_TICKET = '[NUM_TICKET]';
const OPCIONES = '[OPCIONES]';
const AULA_LABO = '[AULA_LABO]';

// Mensajes 
const msgSaludo = '¡Hola! Soy tu asistente de soporte técnico. ';
const msgDetectarIncidencia = '¿En qué puedo ayudarte?';
const msgMuestraOpcion = `Por favor, intenta lo siguiente:\n\n
                            
                            [OPCIONES]\n\n
                            
                          ¿Resolvió tu problema?
                         `;

const msgMuestraOpciones = `Por favor, prueba alguna de estas opciones:\n\n
                            
                            [OPCIONES]\n\n
                            
                            ¿Alguna resolvió tu problema?
                          `;

const msgAyudaAlgoMas = '¿Puedo ayudarte con algo más?';

const msgEncontramosSolucion = `¡Excelente! Hemos registrado tu incidencia con el ticket #[NUM_TICKET], 
                                la cual ya ha sido RESUELTA. `;

const msgNingunaSolucion = `Ups, de acuerdo. Por favor confírmame en qué laboratorio o 
                        aula te encuentras para poder alertar al área y puedan ayudarte.`;

const msgPideAulaLaboratorio = `Listo, hemos enviado la incidencia con ticket #[NUM_TICKET]
                                al área de soporte técnico  en breve se acercarán al [AULA_LABO] para ayudarte.`

// Opciones con las qué machar
const opcNingunaSolucion = 'Ninguna';
const opcRespuestaGracias = 'Gracias';

// A insertar
const usuario = "123";


exports.fulfillment = functions.https.onRequest(
  async (request, response) => {
    const agent = new WebhookClient({ request, response });
    

    function welcomeIntent() {
      agent.add(msgSaludo + msgDetectarIncidencia);
    }

    function fallbackIntent() {
      obtieneLaboratorioAlerta(agent.query);
    }

    async function obtenerIncidencia() {
      const tiposIncidencias = await UtilsBD.getTipoIncidencias();
      let encontrado:boolean = false;
      tiposIncidencias.forEach((doc: any) => {

          if (agent.parameters.incidencias == doc.data()['desc']) {
            encontrado = true;
            
            if (doc.data()['sol']) {
              // Solo hay una solución
              if (doc.data()['sol'].length == 1) {
                let msgOpcion = doc.data()['sol'][0];

                agent.add(msgMuestraOpcion.replace(OPCIONES, msgOpcion));

                agent.add(new Suggestion("Sí"));
                agent.add(new Suggestion("No"));
              } else {
                // Hay varias soluciones
                let msgOpciones = "";
                doc.data()['sol'].forEach(
                  (e: any, i: any) => {
                    msgOpciones += `${i + 1}: ${e} \n`;
                  }
                )

                agent.add(msgMuestraOpciones.replace(OPCIONES, msgOpciones));

                doc.data()['sol'].forEach(
                  (e: any, i: any) => {
                    agent.add(new Suggestion(`Opción ${i + 1}`));
                  }
                )

                agent.add(new Suggestion(opcNingunaSolucion));
                
              }
            }
          }
        }
      );

      if (!encontrado) {
        obtieneLaboratorioAlerta(agent.query);
      }
    }

    async function obtieneOpcion() {
      
      let parametersContext:any = UtilsArray.getContextFromName(agent, "detecciondeincidencia-followup").parameters || {};
      let incidenciaName = parametersContext['incidencias']; // Impresora, Proyector, etc
      
      let numTicket = await UtilsBD.getNumeroTicketSiguiente();

      if (agent.parameters.opciones == opcNingunaSolucion) {
        // No se encontró solucion
        agent.add(msgNingunaSolucion);
      } else {
        // Encontró solución
        agent.add(msgEncontramosSolucion.replace(NUM_TICKET, String(numTicket)) + msgAyudaAlgoMas);
        UtilsBD.registrarIncidencia({
          'ticket-number': numTicket,
          "usuario-registro": usuario,
          "tipo-incidencia": incidenciaName,
          estado: 'R'
        });
        agent.add(new Suggestion("Sí"));
        agent.add(new Suggestion("No"));
        agent.add(new Suggestion("Eso es todo, gracias"));
      }
    }

    function incidenciaResueltaPorAgente() {
      let respuesta = agent.parameters.respuestaincidenciaresuelta || "";
      switch (respuesta) {
        case opcRespuestaGracias:
          agent.add('Gracias a ti, espero que no tengas mayores inconvenientes. ¡Hasta Luego!');
          //agent.conv().close('Gracias a ti, espero que no tengas mayores inconvenientes. ¡Hasta Luego!');
          break;
        case 'No':
          agent.add('Listo, ante cualquier problema no dudes en comunicarte conmigo. ¡Hasta luego!');
          //agent.conv().close('Listo, ante cualquier problema no dudes en comunicarte conmigo. ¡Hasta luego!');
          break;
        default:
          agent.add(msgDetectarIncidencia);
      }
    }

    async function obtieneLaboratorioAlerta(mensajeUsuario: any) {


      let parametersContext:any = UtilsArray.getContextFromName(agent, "detecciondeincidencia-followup").parameters || {};
      let incidenciaName = parametersContext['incidencias']; // Impresora, Proyector, etc

      let numTicket = await UtilsBD.getNumeroTicketSiguiente();
      let incidencia : Incidencia = {
        'ticket-number': numTicket,
        "usuario-registro": usuario,
        "tipo-incidencia": incidenciaName || 'SC',
        estado: 'A'
      }

      if (typeof mensajeUsuario == 'string'){
        incidencia['mensaje-usuario'] = mensajeUsuario;
      }

      UtilsBD.registrarIncidencia(incidencia);
      
      agent.add(
        msgPideAulaLaboratorio.replace(NUM_TICKET, String(numTicket)).replace(AULA_LABO, agent.parameters.aula) +
        msgAyudaAlgoMas
      );
      agent.add(new Suggestion("Sí"));
      agent.add(new Suggestion("No"));
      agent.add(new Suggestion("Eso es todo, gracias"));
    }

    const intentMap = new Map();

    //mapa relacionando el nombre del intent con la función del codigo
    intentMap.set("Default Welcome Intent", welcomeIntent);
    intentMap.set("Default Fallback Intent", fallbackIntent);
    intentMap.set("Deteccion de Incidencia", obtenerIncidencia);
    intentMap.set("Deteccion de Incidencia - opciones", obtieneOpcion);
    intentMap.set("Deteccion de Incidencia - opciones - resuelto", incidenciaResueltaPorAgente);
    intentMap.set("Deteccion de Incidencia - opciones - no resuelto", obtieneLaboratorioAlerta);
    agent.handleRequest(
        intentMap).then(() => console.log('handle will succeed'))
    .catch(err  => console.log('error in request'));

  }
);

