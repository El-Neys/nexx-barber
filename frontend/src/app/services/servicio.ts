
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Servicio {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracionMinutos: number;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ServicioService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/api/servicios';

  obtenerServicios(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(this.apiUrl);
  }
}
