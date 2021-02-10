import { QueryDocumentSnapshot } from "firebase-functions/lib/providers/firestore";

export interface TipoIncidencia extends QueryDocumentSnapshot{
    desc?: string;
    sol?: string[];
}