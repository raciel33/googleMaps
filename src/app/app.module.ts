import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapasComponent } from './mapas/mapas.component';

import { HttpClientModule } from '@angular/common/http';
//Para los sockets
import { SocketIoModule } from 'ngx-socket-io';
import { enviroment } from '../enviroments/enviroment';

@NgModule({
  declarations: [
    AppComponent,
    MapasComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    SocketIoModule.forRoot(enviroment.socketConfig),

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
