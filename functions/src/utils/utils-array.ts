export class UtilsArray{

    static getContextFromName(agent: any, name: string): any {
        let context = {}
        agent.contexts.forEach(
            (e: any) => {
                if (e.name == name) {
                    context = e;
                }
            }
        );
        return context;
    }
    
}