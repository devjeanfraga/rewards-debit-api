import App from './app.js';

App.listen(process.env.PORT, 
    () => console.log(`Server runing on http://${process.env.URL}:${process.env.PORT}/${process.env.API_NAME}/${process.env.API_VERSION}`));