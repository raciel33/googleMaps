import { SocketIoConfig } from "ngx-socket-io";


const config: SocketIoConfig = { url: 'http://localhost:5000', options: {} };


export const enviroment = {

  production: true,
  socketConfig: config
}
