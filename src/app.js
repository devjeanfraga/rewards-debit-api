import { readFile } from 'fs/promises'
import express from 'express';
import Routes from './router.js';
import bodyParser from 'body-parser';
import { Router } from 'express';

import * as OpenApiValidator from 'express-openapi-validator';

const apiSchema = JSON.parse( await readFile(new URL('./api.schema.json', import.meta.url)));
import swaggerUi from 'swagger-ui-express';


 export class App {
    constructor(){
      this.url = process.env.URL  
      this.port = process.env.PORT
      this.appName = process.env.API_NAME
      this.appVersion =  process.env.API_VERSION  
    }

    async init () {
      this.server = express();
      this.middlewares();
      this.routes();
      this.docsSetup()
    }
    
    middlewares(){
        this.server.use(bodyParser.json());
        this.server.use(bodyParser.urlencoded({ extended: false }));
    }

    async docsSetup () {
      this.server.use(`/${this.appName}/${this.appVersion}/docs`, swaggerUi.serve, swaggerUi.setup(apiSchema));
      this.server.use(OpenApiValidator.middleware({ apiSpec: apiSchema }))
    }

    routes(){
        this.server.use(new Router().get('/', (req,res)=> res.status(200).json({"AWS CONFIG":"OK"})));
        this.server.use(`/${this.appName}/${this.appVersion}`,Routes);
    }

    start () {
      this.server.listen(this.port, () => console.log(`
          Server runing on 🤓
          http://${this.url}:${this.port}/${this.appName}/${this.appVersion}
          `))
    }
} 




