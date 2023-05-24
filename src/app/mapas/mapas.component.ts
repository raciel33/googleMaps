import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Lugar } from '../interfaces/lugar';
import { HttpClient } from '@angular/common/http';
import { WebsocketService } from '../services/websocket.service';


@Component({
  selector: 'app-mapas',
  templateUrl: './mapas.component.html',
  styleUrls: ['./mapas.component.css']
})

export class MapasComponent implements OnInit{

  marcadores: google.maps.Marker[] = [];
  infoWindow : google.maps.InfoWindow[] = []

  lugares: Lugar[] = [];

  /**nota:
   * como me estaba dando problemas la referencia de google he tenido que
   * agregar { static:true } y en el tsconfig.app.json :
   * "types": [
      "googlemaps"
    ]
   */
  @ViewChild('map', { static:true } ) mapaElement!: ElementRef;//hace refrencia al #map del html

  map!: google.maps.Map;//se define el mapa

  constructor( private http: HttpClient,
             public wsService: WebsocketService){

  }

  ngOnInit(): void {
    this.escucharSockets();

    this.http.get('http://localhost:5000/googleMap').subscribe( (resp: any)=>{

      this.lugares = resp;
      this.cargarMapa();
    })
  }

  escucharSockets(){

  //marcador-nuevo
   this.wsService.listen('marcador-nuevo-googleMaps').subscribe( (resp: any) =>{
         this.agregarMarcador( resp )
   })

  //marcador-mover
  this.wsService.listen('marcador-mover-googleMaps').subscribe( (resp: any ) =>{

   //this.marcadores[i].getTitle() aqui cuando definimos el titulo le habiamos puesto el id

   for (const i in this.marcadores) {

    //si coincide el id que recible con el id en la position del array borralo
    if (this.marcadores[i].getTitle() === resp.id){

       const latLng = new google.maps.LatLng( resp.lat, resp.lng);//captamos las coordenadad del marcador que estamos recibiendo

       this.marcadores[i].setPosition(latLng);
    }
  }
 });

   //marcador-borrar
   this.wsService.listen('marcador-borrar-googleMaps').subscribe( (id: any ) =>{
    //this.marcadores[i].getTitle() aqui cuando definimos el titulo le habiamos puesto el id
    for (const i in this.marcadores) {
      //si coincide el id que recible con el id en la position del array borralo
      if (this.marcadores[i].getTitle() === id){
        this.marcadores[i].setMap(null)//borramos
      }
    }


    })
  }

  cargarMapa(){

    const latLng = new google.maps.LatLng(37.784679,-122.395936);//definimos latitud y longitud

    const mapaOpciones: google.maps.MapOptions = {
      center: latLng,//los centramos en las coordenadas indicadas
      zoom:13,//le damos un zoom
      mapTypeId: google.maps.MapTypeId.ROADMAP//definimos el tipo de mapa que queremos
    }

    //le pasamos al mapa el html donde lo va crear y las opciones definidas del mapa
    this.map = new google.maps.Map( this.mapaElement.nativeElement, mapaOpciones )

    //al hacer click en algun lugar del mapa se crea un marcador
    this.map.addListener('click',(coors) => {

      const nuevoMarcador: Lugar = {
        nombre: 'Nuevo lugar',
        lat: coors.latLng.lat(),
        lng: coors.latLng.lng(),
        id: new Date().toISOString()
      }

      this.agregarMarcador( nuevoMarcador );

      //emitimos por socket del nuevo marcador
      this.wsService.emit('marcador-nuevo-googleMaps', nuevoMarcador )

    })


    //vamos pasando el lugar como parametro en agregar marcadores
     for (const lugar of this.lugares ) {
      this.agregarMarcador( lugar );
     }


  }


  //---------------------------------------------------

  agregarMarcador( marcador: Lugar ){

    const latLng = new google.maps.LatLng(marcador.lat, marcador.lng );//definimos latitud y longitud

    //Creacion del marcador
    const marker = new google.maps.Marker({
      map: this.map, //indicamo el mapa donde estara el marcador
      animation: google.maps.Animation.DROP,//le damos una animation
      position: latLng,//indicamos la position del marcador
      draggable: true, //le decimos que el marcador se puede mover cuando lo arrastre
      title: marcador.id //como no existe el id en google.maps.Marker se lo ponemos al title
    })

    //añadimos nuestro marcador al array de marcadores
    this.marcadores.push( marker );

    //creamos la ventanita del marcador
    const contenido = `<b>${marcador.nombre}</b>`;
    const infoWindow = new google.maps.InfoWindow({
      content:contenido
    });


    this.infoWindow.push( infoWindow )

    //Cuando se hace clik en el marcador se abre la ventana con informacin
     google.maps.event.addDomListener( marker, 'click', ( coors )=>{

      //con esto hacemos que cuando abra un marcador el resto cierre sus ventanas
        this.infoWindow.forEach( infoW => infoW.close())
         infoWindow.open( this.map, marker )
  });


    //Cuando se hace doble clik en el marcador se borra el marcador
    google.maps.event.addDomListener( marker, 'dblclick', ( coors )=>{

        marker.setMap( null );//se destruye el marcador

       //emitimos por socket al borrar marcador
       this.wsService.emit('marcador-borrar-googleMaps', marcador.id )


    });

    //Cuando se hace mueve el marcador
    google.maps.event.addDomListener( marker, 'drag', ( coors:any )=>{

      const nuevoMarcador = {
        //extraemos la latitud y la longitud
        lat:coors.latLng.lat(),
        lng:coors.latLng.lng(),
        nombre: marcador.nombre,//cojemos el nombre
        id: marcador.id
      }

    //emitimos por socket al mover marcador
     this.wsService.emit('marcador-mover-googleMaps' , nuevoMarcador )
  });



  }
}
