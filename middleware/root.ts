import axios from "axios";

export class Client {
    route: string;
    logRequest: boolean;
    logResponse: boolean;
    constructor(route: string, logRequest: boolean, logResponse: boolean)
    {
        this.route = route;
        this.logRequest = logRequest;
        this.logResponse = logResponse;
    }
    send()
    {
        
    }
} 