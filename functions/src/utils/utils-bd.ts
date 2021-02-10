import * as admin from "firebase-admin";
import { Incidencia } from '../models/incidencia';
admin.initializeApp();
const db = admin.firestore();

// Obtiene referencias a la BD
const tipoIncidenciasRef = db.collection('tipo-incidencias');
const incidenciasRef = db.collection('incidencias');

export class UtilsBD {
    
    static async getNumeroTicketSiguiente(): Promise<number> {
        const incidenciasSnapshot = await incidenciasRef.orderBy('ticket-number', 'desc').limit(1).get();
        let numTicket = 0;
        if (!incidenciasSnapshot.empty) {
            numTicket = incidenciasSnapshot.docs[0].data()['ticket-number'] || 0;
        }
        return numTicket + 1;
    }
    
    static async getTipoIncidencias() {
        return await tipoIncidenciasRef.get();
    }

    static async registrarIncidencia(incidencia: Incidencia) {
        await incidenciasRef.doc(String(incidencia["ticket-number"])).set(
            incidencia
        );
    }
    
}