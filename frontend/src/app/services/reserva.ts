
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NuevaReserva {
  cliente: {
    nombre: string;
    telefono: string;
  };
  barbero: string;
  servicio: string;
  fechaHoraInicio: string;
}

export interface RespuestaDisponibilidad {
  fecha: string;
  barbero: string;
  servicio: string;
  duracionMinutos: number;
  horariosDisponibles: string[];
  mensaje?: string;
}

export interface Reserva {
  _id: string;

  cliente: {
    _id: string;
    nombre: string;
    telefono: string;
  };

  barbero: {
    _id: string;
    nombre: string;
  };

  servicio: {
    _id: string;
    nombre: string;
    precio: number;
    duracionMinutos: number;
  };

  fechaHoraInicio: string;
  fechaHoraFin: string;
  precio: number;
  duracionMinutos: number;
  estado: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReservaService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/api/reservas';

  obtenerDisponibilidad(
    fecha: string,
    barbero: string,
    servicio: string
  ): Observable<RespuestaDisponibilidad> {

    const params = new HttpParams()
      .set('fecha', fecha)
      .set('barbero', barbero)
      .set('servicio', servicio);

    return this.http.get<RespuestaDisponibilidad>(
      `${this.apiUrl}/disponibilidad`,
      { params }
    );
  }

  crearReserva(datos: NuevaReserva): Observable<unknown> {
    return this.http.post<unknown>(this.apiUrl, datos);
  }

  obtenerReservas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(this.apiUrl);
  }
}
