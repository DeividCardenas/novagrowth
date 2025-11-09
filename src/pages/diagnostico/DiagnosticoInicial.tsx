import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  DiagnosticoFormData,
  FormErrors,
  TipoPersona,
} from "../../types/diagnostico";
import { FormField } from "../../components/forms/FormField";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { TIPO_ID_OPTIONS } from "../../config/constants";

// 🗺️ Leaflet y estilos
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";

const initialState: DiagnosticoFormData = {
  correo: "",
  razonSocial: "",
  tipoPersona: "JURIDICA",
  representante: "",
  tipoId: "NIT",
  numeroId: "",
  direccion: "",
  georef: "",
  actividad: "",
  numTrabajadores: "",
  jornada: "",
  entradasSalidas: "",
  procesosSinES: "",
  aceptaTratamiento: false,
};

const mapContainerStyle = {
  width: "100%",
  height: "350px",
  borderRadius: "12px",
};

const center: [number, number] = [4.711, -74.0721]; // Bogotá

export default function DiagnosticoInicial() {
  const navigate = useNavigate();
  const [data, setData] = useState<DiagnosticoFormData>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [selected, setSelected] = useState<[number, number] | null>(null);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // 📍 Maneja el clic en el mapa
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        setSelected([lat, lng]);
        setData((prev) => ({
          ...prev,
          georef: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        }));
      },
    });
    return selected ? (
      <Marker
        position={selected}
        icon={L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
          iconSize: [30, 30],
        })}
      />
    ) : null;
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!data.correo || !/^\S+@\S+\.\S+$/.test(data.correo))
      e.correo = "Ingresa un correo válido.";
    if (!data.razonSocial.trim()) e.razonSocial = "Campo obligatorio.";
    if (data.tipoPersona === "JURIDICA" && !data.representante.trim())
      e.representante = "Obligatorio para persona jurídica.";
    if (!data.numeroId.trim()) e.numeroId = "Campo obligatorio.";
    if (!data.direccion.trim()) e.direccion = "Campo obligatorio.";
    if (!data.georef.trim())
      e.georef = "Selecciona una ubicación en el mapa o ingresa coordenadas.";
    if (!data.actividad.trim()) e.actividad = "Campo obligatorio.";
    if (!data.numTrabajadores || isNaN(Number(data.numTrabajadores)))
      e.numTrabajadores = "Ingresa un número válido.";
    if (!data.jornada.trim()) e.jornada = "Campo obligatorio.";
    if (!data.entradasSalidas.trim())
      e.entradasSalidas = "Describe entradas y salidas.";
    if (!data.aceptaTratamiento)
      e.aceptaTratamiento = "Debes aceptar el tratamiento de datos.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    console.log("Diagnóstico enviado:", data);
    alert("Diagnóstico enviado. ¡Gracias!");
    navigate("/dashboard");
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-brand-800 to-brand-900 text-white p-6 flex items-center gap-4">
          <img
            src="/img/LOGO.png"
            alt="Logo Nova Growth"
            title="Volver al Dashboard"
            onClick={() => navigate("/dashboard")}
            className="h-8 cursor-pointer"
          />
          <h1 className="text-2xl font-bold tracking-wide">
            Diagnóstico Inicial
          </h1>
        </div>

        <form onSubmit={onSubmit} noValidate className="p-6 space-y-6">
          {/* --- Section: Identificación de la organización --- */}
          <section className="border border-gray-200 rounded-xl p-5">
            <h3 className="text-lg font-extrabold text-brand-900 mb-6">
              Identificación de la organización
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
              <FormField
                label="Correo"
                htmlFor="correo"
                error={errors.correo}
                required
              >
                <Input
                  id="correo"
                  name="correo"
                  type="email"
                  value={data.correo}
                  onChange={onChange}
                />
              </FormField>

              <FormField
                label="Nombre o razón social"
                htmlFor="razonSocial"
                error={errors.razonSocial}
                required
              >
                <Input
                  id="razonSocial"
                  name="razonSocial"
                  type="text"
                  value={data.razonSocial}
                  onChange={onChange}
                />
              </FormField>

              <FormField label="Tipo de persona" required>
                <div className="flex flex-wrap gap-4">
                  {(["JURIDICA", "NATURAL"] as TipoPersona[]).map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="tipoPersona"
                        value={type}
                        checked={data.tipoPersona === type}
                        onChange={onChange}
                        className="accent-brand-900"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </FormField>

              {data.tipoPersona === "JURIDICA" && (
                <FormField
                  label="Nombre del representante legal"
                  htmlFor="representante"
                  error={errors.representante}
                  required
                >
                  <Input
                    id="representante"
                    name="representante"
                    type="text"
                    value={data.representante}
                    onChange={onChange}
                  />
                </FormField>
              )}

              <FormField label="Tipo de identificación" required>
                <div className="flex flex-wrap gap-4">
                  {TIPO_ID_OPTIONS.map(({ value, label }) => (
                    <label
                      key={value}
                      className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="tipoId"
                        value={value}
                        checked={data.tipoId === value}
                        onChange={onChange}
                        className="accent-brand-900"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </FormField>

              <FormField
                label="Número de identificación"
                htmlFor="numeroId"
                error={errors.numeroId}
                required
              >
                <Input
                  id="numeroId"
                  name="numeroId"
                  type="text"
                  value={data.numeroId}
                  onChange={onChange}
                />
              </FormField>

              <FormField
                label="Dirección de la empresa"
                htmlFor="direccion"
                error={errors.direccion}
                required
              >
                <Input
                  id="direccion"
                  name="direccion"
                  type="text"
                  placeholder="Calle #, Ciudad, Departamento"
                  value={data.direccion}
                  onChange={onChange}
                />
              </FormField>

              <FormField
                label="Georreferenciación"
                htmlFor="georef"
                error={errors.georef}
                required
                hint="Selecciona en el mapa o ingresa coordenadas manualmente (lat, lng)"
              >
                <Input
                  id="georef"
                  name="georef"
                  type="text"
                  value={data.georef}
                  onChange={onChange}
                />
              </FormField>
            </div>

            {/* --- OpenStreetMap (Leaflet) --- */}
            <div className="mt-6 rounded-lg overflow-hidden">
              <MapContainer
                center={selected || center}
                zoom={6}
                style={mapContainerStyle}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickHandler />
              </MapContainer>
              <p className="text-sm text-gray-500 mt-2">
                Haz clic en el mapa para establecer la ubicación exacta.
              </p>
            </div>
          </section>

          {/* --- Resto del formulario igual --- */}
          <div className="pt-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="aceptaTratamiento"
                name="aceptaTratamiento"
                checked={data.aceptaTratamiento}
                onChange={onChange}
                className="h-4 w-4 rounded accent-brand-900"
              />
              <label htmlFor="aceptaTratamiento" className="text-sm">
                Acepto el tratamiento de mis datos personales.
              </label>
            </div>
            {errors.aceptaTratamiento && (
              <p className="text-sm font-bold text-red-600 mt-2">
                {errors.aceptaTratamiento}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>

            <Button type="submit" variant="primary">
              Enviar diagnóstico
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
