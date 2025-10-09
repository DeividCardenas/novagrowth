import { useMemo, useState } from "react";

import { Role } from "../../types/role";
import RoleForm from "../../components/roles/RoleForm";
import RoleTable from "../../components/roles/RoleTable";
import RoleToolbar from "../../components/roles/RoleToolbar";
import { exportRolesCSV } from "../../api/roles.api";
import { useRoles } from "../../hooks/useRoles";

export default function RolesPage() {
  const {
    roles, loading, error,
    search, setSearch, page, setPage, pageSize, setPageSize, totalPages, paged,
    selectedIds, toggleSelect, clearSelection,
    addRole, editRole, removeRole, importCSV,
  } = useRoles();

  const [editing, setEditing] = useState<Role | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const title = useMemo(() => (editing ? "Modificar rol" : "Insertar rol"), [editing]);

  function openInsert() { setEditing(null); setOpenForm(true); }
  function openModify() {
    const pick = roles.find(r => selectedIds.includes(r.id));
    if (!pick) return;
    setEditing(pick); setOpenForm(true);
  }
  async function doDelete() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Eliminar ${selectedIds.length} rol(es)?`)) return;
    for (const id of selectedIds) await removeRole(id);
    clearSelection();
  }
  function doExport() {
    const blob = exportRolesCSV(roles);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "roles.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function doImport(file: File) {
    await importCSV(file);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-brand-800 to-brand-900 rounded-xl text-white px-5 py-4 shadow">
        <h1 className="text-lg font-bold">Roles & Permisos</h1>
        <p className="text-white/80 text-sm">Gestiona los roles del sistema y sus permisos.</p>
      </div>

      {/* Toolbar */}
      <RoleToolbar
        onInsert={openInsert}
        onModify={openModify}
        onDelete={doDelete}
        onExport={doExport}
        onImport={doImport}
        search={search}
        setSearch={setSearch}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />

      {/* Estado */}
      {loading && <div className="text-gray-600">Cargando…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {/* Tabla */}
      {!loading && !error && (
        <>
          <RoleTable rows={paged} selectedIds={selectedIds} toggleSelect={toggleSelect} />

          {/* Paginación */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded border" onClick={() => setPage(1)} disabled={page === 1}>{`<<`}</button>
              <button className="px-3 py-1 rounded border" onClick={() => setPage(Math.max(1, page-1))} disabled={page === 1}>{`<`}</button>
              <button className="px-3 py-1 rounded border" onClick={() => setPage(Math.min(totalPages, page+1))} disabled={page === totalPages}>{`>`}</button>
              <button className="px-3 py-1 rounded border" onClick={() => setPage(totalPages)} disabled={page === totalPages}>{`>>`}</button>
            </div>
          </div>
        </>
      )}

      {/* Modal Form */}
      {openForm && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button onClick={() => { setOpenForm(false); setEditing(null); }} className="text-gray-500">✕</button>
            </div>
            <RoleForm
              initial={editing}
              onSubmit={async (data) => {
                if (editing) await editRole(editing.id, data);
                else await addRole(data);
                setOpenForm(false); setEditing(null);
              }}
              onCancel={() => { setOpenForm(false); setEditing(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}