import { App } from './app.js';
import process from 'process'


( async () => {
  const ExitStatus = { Failure: 1, Success: 0 }

  try {

    /*
      INIT AND RUN SERVER
    */

    const server = new App()
    await server.init()
    server.start()

    /*
      GRACEFUL SHUTDOWN
    */

    const exitSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT']
    exitSignals.map(sign => {
      process.on(sign, async () => { 
        try{
          console.log(" ✅ App exit with success...Bye! 🤓")
          process.exit(ExitStatus.Success)

        } catch (error) {
          console.log("App exit with error: " + error)
          process.exit(ExitStatus.Failure)
        }
      });
    });

  } catch (error) {
    console.log(`App exit with error: ${error}`)
    process.exit(ExitStatus.Failure)
  }

})();



/*
App.listen(process.env.PORT, 
    () => console.log(`
      Server runing on 
      http://${process.env.URL}:${process.env.PORT}/${process.env.API_NAME}/${process.env.API_VERSION}
      `));
*/