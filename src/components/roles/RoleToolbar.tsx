import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import React from "react";

type Props = {
  onInsert: () => void;
  onModify: () => void;
  onDelete: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  search: string;
  setSearch: (v: string) => void;
  pageSize: number;
  setPageSize: (n: number) => void;
};

export default function RoleToolbar({
  onInsert, onModify, onDelete, onExport, onImport,
  search, setSearch, pageSize, setPageSize,
}: Props) {
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex gap-2 flex-wrap">
        <Button onClick={onInsert}>Insertar</Button>
        <Button variant="secondary" onClick={onModify}>Modificar</Button>
        <Button variant="ghost" onClick={onDelete} className="border border-red-300 text-red-600">Eliminar</Button>
        <Button onClick={onExport}>Exportar</Button>

        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
        />
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>Importar</Button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Mostrar</label>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(parseInt(e.target.value))}
          className="border rounded-md px-2 py-1"
        >
          {[10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
        </select>

        <div className="w-64">
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
    </div>
  );
}