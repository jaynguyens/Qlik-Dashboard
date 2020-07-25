1. Create a folder `enigma` inside `/src`.

2. create a `configSession.js` file in the newly created folder

What is the config do? The configSession is to

The `configSession.js` allows us to open and close sessions of our project.

```javascript
import enigma from "enigma.js";
import schema from "enigma.js/schemas/12.67.2.json";
```

first we need to create a session. A session is ...
To create a session we needs two things: a schema and a url to the qlik server.
[READ THE DOC](https://github.com/qlik-oss/enigma.js/blob/master/docs/api.md#enigmacreateconfig)

```javascript
const session = enigma.create({
   schema,
   url
});
```

Qlik has multiple schemas available on their [Github repo](https://github.com/qlik-oss/enigma.js/tree/master/schemas). Best bet is to pick the most recent schema available, [schema 16.67.2.json](https://github.com/qlik-oss/enigma.js/blob/master/schemas/12.67.2.json).

The second thing is the url to the Qlik server instance.

We should not store any information about our Qlik server on our code. Which is why, following best practice, we must store any sensitive information on dotenv file. Read more [here](https://medium.com/@maxbeatty/environment-variables-in-node-js-28e951631801)
In our main folder, create a file `.env`

```bash
vim .env
```

For CRA, we define our enviroment variables starting with `REACT_APP_` - read more [here](https://create-react-app.dev/docs/adding-custom-environment-variables/).

The url needs to have a `host`, `port`, `secure` and `prefix` enviroment variables.

```dotenv
REACT_APP_QLIK_HOST=localhost
REACT_APP_QLIK_PORT=4848
REACT_APP_QLIK_PREFIX=
REACT_APP_QLIK_SECURE=true
REACT_APP_QLIK_APPID=Insurance Claims 2020.qvf
```

Remember that our ReactJs talks to our Qlik Engine through WebSocket.
Which is why the url must contain a proper websocket URL to QIX Engine.

To make use of our enviroment variables, we create an object in the `configSession.js` to hold all the required variables to make an WebSocket url.

```javascript
const config = {
   host: process.env.REACT_APP_QLIK_HOST,
   port: process.env.REACT_APP_QLIK_PORT,
   secure: process.env.REACT_APP_QLIK_SECURE,
   prefix: process.env.REACT_APP_QLIK_PREFIX,
   appId: process.env.REACT_APP_QLIK_APPID
};
```

We can do create our own url:

```javascript
const url = (host, port) => {
   const portUrl = id => (id ? `:${id}` : ``);
   return `ws://${host}${portUrl(port)}/app`;
};
```

Alternative, we can use a library from `enigma.js` to generate QIX WebSocket URLs using the our config object.
Read the [SenseUtilities API](https://github.com/qlik-oss/enigma.js/blob/master/docs/api.md#sense-utilities-api)

```javascript
const SenseUtilities = require("enigma.js/sense-utilities");
const url = SenseUtilities.buildUrl(config);
```

We create two functions to work with our session. Read the [Session API](https://github.com/qlik-oss/enigma.js/blob/master/docs/api.md#session-api).

```javascript
const openSession = async () => {
   const qix = await session.open();
   const document = await qix.openDoc(config.appId);
   return document;
};

const closeSession = async () => await session.close();

export { openSession, closeSession };
```

So far, our `configSession.js` look like this:

```javascript
import enigma from "enigma.js";
import schema from "enigma.js/schemas/12.67.2.json";

const config = {
   host: process.env.REACT_APP_QLIK_HOST,
   port: process.env.REACT_APP_QLIK_PORT,
   secure: process.env.REACT_APP_QLIK_SECURE,
   prefix: process.env.REACT_APP_QLIK_PREFIX,
   appId: process.env.REACT_APP_QLIK_APPID
};

const url = (host, port) => {
   const portUrl = id => (id ? `:${id}` : ``);
   return `ws://${host}${portUrl(port)}/app`;
};

const session = enigma.create({
   schema,
   url: url(config.host, config.port)
});

const openSession = async () => {
   const qix = await session.open();
   const document = await qix.openDoc(config.appId);
   return document;
};

const closeSession = () => session.close();

export { openSession, closeSession };
```

Now we have a way of connecting to the QIX Engine and closing it. So how do we apply this to our app?

To use our openSession and closeSession, we created a context API to provides our mashup an overlay of staying open wen using the app.

Document about Context API - [reactjs.org](https://reactjs.org/docs/context.html),

Create a `docProvider.js` in `enigma` folder

```javascript
import React, { useState, useEffect, createContext } from "react";
import { openSession, closeSession } from "./configSession";

export const QDocContext = createContext();

const DocProvider = ({ children }) => {
   const [qDoc, setqDoc] = useState();

   useEffect(() => {
      const openDoc = async () => {
         setqDoc(await openSession());
      };
      openDoc();
      return closeSession;
   }, []);
   return (
      <React.StrictMode>
         {qDoc && (
            <QDocContext.Provider value={qDoc}>{children}</QDocContext.Provider>
         )}
      </React.StrictMode>
   );
};
export default DocProvider;
```

To use what we just created, we are going to fetch the object of one of the chart in Qlik Sense.
