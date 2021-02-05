"use strict";
const functions = require("firebase-functions");
const {WebhookClient} = require("dialogflow-fulfillment");
//const {Card, Suggestion} = require("dialogflow-fulfillment");
process.env.DEBUG = "dialogflow:debug"; 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(
    (request: any, response: any) => {
        const agent = new WebhookClient({ request, response });
        console.log("Dialogflow Request headers: " + JSON.stringify(request.headers));
        console.log("Dialogflow Request body: " + JSON.stringify(request.body));

        function welcome(agent: any) {
        agent.add(`Welcome to my agent!`);
        }

        function fallback(agent: any) {
        agent.add(`I didn"t understand`);
        agent.add(`I"m sorry, can you try again?`);
    }
  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set("Default Welcome Intent", welcome);
  intentMap.set("Default Fallback Intent", fallback);
  // intentMap.set("your intent name here", yourFunctionHandler);
  // intentMap.set("your intent name here", googleAssistantHandler);
  agent.handleRequest(intentMap);
});
