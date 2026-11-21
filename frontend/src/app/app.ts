
import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';

import { ServicioService, Servicio } from './services/servicio';
import {
  ReservaService,
  NuevaReserva
} from './services/reserva';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  servicios: Servicio[] = [];

  servicioSeleccionado: string | null = null;

  mostrarReservas = false;
  diaSeleccionado: string | null = null;
  horaSeleccionada: string | null = null;
  reservaConfirmada = false;
  mostrarFormulario = false;

  cargandoServicios = false;
  errorServicios = '';

  cargandoReserva = false;
  errorReserva = '';

  cargandoDisponibilidad = false;
  errorDisponibilidad = '';
  horariosDisponibles: string[] = [];

  private solicitudDisponibilidad = 0;

  datosCliente = {
    nombre: '',
    apellido: '',
    telefono: ''
  };

  diasDisponibles: any[] = [];

  private readonly barberoId = '6b01197dc6f784818b3342fc';

  constructor(
    private servicioService: ServicioService,
    private reservaService: ReservaService,
    private cdr: ChangeDetectorRef,
    public router: Router
  ) {
    this.generarDiasDisponibles();
    this.cargarServicios();
  }

  cargarServicios(): void {
    this.cargandoServicios = true;
    this.errorServicios = '';

    this.servicioService.obtenerServicios().subscribe({
      next: (servicios) => {
        this.servicios = servicios.filter(servicio => servicio.activo);
        this.cargandoServicios = false;

        console.log('Servicios recibidos desde MongoDB:', this.servicios);

        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Error al cargar servicios:', error);

        this.errorServicios = 'No fue posible cargar los servicios.';
        this.cargandoServicios = false;

        this.cdr.markForCheck();
      }
    });
  }

  generarDiasDisponibles(): void {
    const hoy = new Date();

    for (let i = 1; i <= 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);

      this.diasDisponibles.push({
        fecha: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`,
        dia: fecha.toLocaleDateString('es-CO', { weekday: 'short' }),
        numero: fecha.getDate(),
        mes: fecha.toLocaleDateString('es-CO', { month: 'short' })
      });
    }
  }

  seleccionarServicio(id: string): void {
    this.solicitudDisponibilidad++;

    this.servicioSeleccionado = id;
    this.mostrarReservas = false;
    this.diaSeleccionado = null;
    this.horaSeleccionada = null;
    this.reservaConfirmada = false;
    this.mostrarFormulario = false;
    this.errorReserva = '';

    this.horariosDisponibles = [];
    this.cargandoDisponibilidad = false;
    this.errorDisponibilidad = '';
  }

  abrirReservas(): void {
    document.getElementById('reservas')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    this.solicitudDisponibilidad++;

    this.mostrarReservas = true;
    this.diaSeleccionado = null;
    this.horaSeleccionada = null;
    this.reservaConfirmada = false;
    this.mostrarFormulario = false;
    this.errorReserva = '';

    this.horariosDisponibles = [];
    this.cargandoDisponibilidad = false;
    this.errorDisponibilidad = '';
  }

  seleccionarDia(fecha: string): void {
    this.diaSeleccionado = fecha;
    this.horaSeleccionada = null;
    this.mostrarFormulario = false;
    this.errorReserva = '';

    this.cargarDisponibilidad(fecha);
  }

  cargarDisponibilidad(fecha: string): void {
    if (!this.servicioSeleccionado) {
      return;
    }

    const solicitudActual = ++this.solicitudDisponibilidad;

    this.cargandoDisponibilidad = true;
    this.errorDisponibilidad = '';
    this.horariosDisponibles = [];

    this.reservaService.obtenerDisponibilidad(
      fecha,
      this.barberoId,
      this.servicioSeleccionado
    ).subscribe({
      next: (respuesta) => {
        if (solicitudActual !== this.solicitudDisponibilidad) {
          return;
        }

        this.horariosDisponibles = respuesta.horariosDisponibles.map(
          hora => this.convertirHoraAMPM(hora)
        );

        this.cargandoDisponibilidad = false;

        console.log('Horarios disponibles recibidos:', this.horariosDisponibles);

        this.cdr.markForCheck();
      },

      error: (error) => {
        if (solicitudActual !== this.solicitudDisponibilidad) {
          return;
        }

        console.error('Error al consultar disponibilidad:', error);

        this.errorDisponibilidad =
          error.error?.mensaje ||
          'No fue posible consultar los horarios disponibles.';

        this.cargandoDisponibilidad = false;

        this.cdr.markForCheck();
      }
    });
  }

  convertirHoraAMPM(hora: string): string {
    const [horaTexto, minutos] = hora.split(':');
    let horaNumero = Number(horaTexto);

    const periodo = horaNumero >= 12 ? 'PM' : 'AM';

    if (horaNumero === 0) {
      horaNumero = 12;
    } else if (horaNumero > 12) {
      horaNumero -= 12;
    }

    return `${String(horaNumero).padStart(2, '0')}:${minutos} ${periodo}`;
  }

  seleccionarHora(hora: string): void {
    this.horaSeleccionada = hora;
    this.mostrarFormulario = false;
    this.errorReserva = '';
  }

  confirmarReserva(): void {
    if (
      this.servicioSeleccionado === null ||
      this.diaSeleccionado === null ||
      this.horaSeleccionada === null
    ) {
      return;
    }

    this.mostrarFormulario = true;
    this.reservaConfirmada = false;
    this.errorReserva = '';
  }

  guardarReserva(): void {
    const { nombre, apellido, telefono } = this.datosCliente;

    if (
      !nombre.trim() ||
      !apellido.trim() ||
      !telefono.trim() ||
      !this.servicioSeleccionado ||
      !this.diaSeleccionado ||
      !this.horaSeleccionada ||
      this.cargandoReserva
    ) {
      return;
    }

    const [horaTexto, periodo] = this.horaSeleccionada.split(' ');
    let [hora, minutos] = horaTexto.split(':').map(Number);

    if (periodo === 'AM' && hora === 12) {
      hora = 0;
    }

    if (periodo === 'PM' && hora !== 12) {
      hora += 12;
    }

    const fechaHoraInicio =
      `${this.diaSeleccionado}T` +
      `${String(hora).padStart(2, '0')}:` +
      `${String(minutos).padStart(2, '0')}:00-05:00`;

    const datosReserva: NuevaReserva = {
      cliente: {
        nombre: `${nombre.trim()} ${apellido.trim()}`,
        telefono: telefono.trim()
      },
      barbero: this.barberoId,
      servicio: this.servicioSeleccionado,
      fechaHoraInicio
    };

    this.cargandoReserva = true;
    this.errorReserva = '';

    console.log('Enviando reserva al backend:', datosReserva);

    this.reservaService.crearReserva(datosReserva).subscribe({
      next: (respuesta) => {
        console.log('Reserva registrada correctamente:', respuesta);

        this.cargandoReserva = false;
        this.reservaConfirmada = true;
        this.mostrarFormulario = false;

        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Error al registrar reserva:', error);

        this.cargandoReserva = false;

        this.errorReserva =
          error.error?.mensaje ||
          'No fue posible registrar la reserva. Intenta nuevamente.';

        this.cdr.markForCheck();
      }
    });
  }

  obtenerServicioSeleccionado(): Servicio | undefined {
    return this.servicios.find(
      servicio => servicio._id === this.servicioSeleccionado
    );
  }
}
