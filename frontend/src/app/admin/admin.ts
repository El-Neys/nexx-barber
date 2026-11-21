
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Reserva, ReservaService } from '../services/reserva';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {

  private reservaService = inject(ReservaService);

  reservas: Reserva[] = [];
  cargando = true;
  error = '';

  ngOnInit(): void {
    this.cargarReservas();
  }

  cargarReservas(): void {
    this.cargando = true;
    this.error = '';

    this.reservaService.obtenerReservas().subscribe({

      next: (respuesta: Reserva[]) => {
        this.reservas = respuesta;
        this.cargando = false;

        console.log('Reservas cargadas:', respuesta);
        console.log('Cantidad de reservas:', this.reservas.length);
        console.log('Contenido de reservas:', this.reservas);
      },

      error: (error) => {
        console.error('Error al cargar reservas:', error);

        this.error = 'No fue posible cargar las reservas.';
        this.cargando = false;
      }

    });
  }
}
