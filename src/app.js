import express from 'express';
import Routes from './router.js';
import bodyParser from 'body-parser';
import { Router } from 'express';


class App {
    constructor(){
        this.server = express();
        this.middlewares();
        this.routes();
    }
    
    middlewares(){
        this.server.use(bodyParser.json());
        this.server.use(bodyParser.urlencoded({ extended: false }));
    }

    routes(){
        this.server.use(new Router().get('/', (req,res)=> res.status(200).json({"AWS CONFIG":"OK"})));
        this.server.use(`/${process.env.API_NAME}/${process.env.API_VERSION}`,Routes);
    }
} 

export default new App().server;


