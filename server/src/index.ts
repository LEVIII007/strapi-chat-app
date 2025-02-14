import { setupWebSocket } from './websockets/chat';

export default {
  register() {},

  bootstrap({ strapi }) {
    setupWebSocket(strapi);
  },
};
