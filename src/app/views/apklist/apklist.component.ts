import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AlertController, ToastController, IonicModule } from '@ionic/angular';
import { FirestoreService } from './../../common/services/firestore.service';
import { Categoria } from './../../common/models/categoria.models';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { Buckle } from '../../common/models/bucke.model';

@Component({
  selector: 'app-apk-list',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule], // Asegúrate de que IonicModule esté aquí
  templateUrl: './apklist.component.html',
  styleUrls: ['./apklist.component.scss'],
})
export class ApkListComponent implements OnInit {
  // Propiedades de la Hebilla
  buckle: Buckle = {
    id: '',
    modelo: '',
    material: '',
    price: '',
    medida: '',
    peso: 0,
    fechaCreacion: new Date(),
    imagenUrl: '',
    currency: 'USD', // Valor por defecto
  };

  // Lista de hebillas
  buckles: Buckle[] = [];

  // Archivo de imagen seleccionado
  imagenArchivo: File | null = null;

  // Opciones de moneda
  currencies = [
    { value: 'USD', label: 'Dólar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'ARS', label: 'Pesos (ARS)' },
  ];

  constructor(
    private firestoreService: FirestoreService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.cargarBuckles();
  }

  // Cargar hebillas desde Firestore
  cargarBuckles() {
    this.firestoreService.getCollectionChanges<Buckle>('buckles').subscribe(
      (data) => {
        this.buckles = data;
      },
      (error) => {
        console.error('Error al cargar hebillas:', error);
      }
    );
  }

  // Manejar la selección de archivo
  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.imagenArchivo = file;
  }

  // Subir hebilla
  async subirBuckle() {
    // Validaciones básicas
    if (
      !this.buckle.modelo ||
      !this.buckle.material ||
      !this.buckle.medida ||
      !this.buckle.peso ||
      !this.buckle.currency
    ) {
      this.mostrarToast(
        'Por favor, complete todos los campos obligatorios.',
        'warning'
      );
      return;
    }

    const id = uuidv4();
    this.buckle.id = id;
    this.buckle.fechaCreacion = new Date();

    try {
      if (this.imagenArchivo) {
        const imagenUrl = await this.firestoreService.uploadFile(
          this.imagenArchivo,
          `imagenes/hebillas/${id}`
        );
        this.buckle.imagenUrl = imagenUrl;
      }

      await this.firestoreService.createDocument(this.buckle, `buckles/${id}`);
      this.mostrarToast('Hebilla subida exitosamente', 'success');
      this.resetForm();
      // No es necesario recargar las hebillas ya que Firestore actualiza la suscripción automáticamente
    } catch (error) {
      console.error('Error al subir la hebilla:', error);
      this.mostrarToast('Error al subir la hebilla', 'danger');
    }
  }

  // Borrar hebilla
  async borrarBuckle(buckleId: string) {
    try {
      await this.firestoreService.deleteDocumentID('buckles', buckleId);
      this.mostrarToast('Hebilla eliminada exitosamente', 'success');
      // No es necesario recargar las hebillas ya que Firestore actualiza la suscripción automáticamente
    } catch (error) {
      console.error('Error al eliminar la hebilla:', error);
      this.mostrarToast('Error al eliminar la hebilla', 'danger');
    }
  }

  // Reiniciar el formulario
  resetForm() {
    this.buckle = {
      id: '',
      modelo: '',
      material: '',
      medida: '',
      peso: 0,
      price: '',
      fechaCreacion: new Date(),
      imagenUrl: '',
      currency: 'USD', // Valor por defecto
    };
    this.imagenArchivo = null;
  }

  // Mostrar Toast
  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      color: color,
    });
    toast.present();
  }


   // Obtener símbolo de moneda
  getCurrencySymbol(currency: string): string {
    switch (currency) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
         case 'ARS':
        return '$';
      default:
        return '';
    }
  }
}
