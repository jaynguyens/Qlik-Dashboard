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

const closeSession = async () => await session.close();

export { openSession, closeSession };
