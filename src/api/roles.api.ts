import { Permission, Role, RoleInput } from "../types/role";

import api from "./axios";

/** ============================
 *  Helpers de mapeo y orden
 * ============================ */
const sortByIdAsc = (list: Role[]) =>
  [...list].sort((a, b) => (parseInt(a.id, 10) || 0) - (parseInt(b.id, 10) || 0));

const encodePerm = (p: Permission) => `${p.module}:${p.action}`;

const decodePerm = (raw: any): Permission | null => {
  // Permiso como objeto { module, action }
  if (raw && typeof raw === "object" && raw.module && raw.action) {
    return { module: raw.module, action: raw.action } as Permission;
  }
  // Permiso como string "modulo:accion"
  if (typeof raw === "string" && raw.includes(":")) {
    const [module, action] = raw.split(":");
    return { module, action } as Permission;
  }
  return null;
};

type ServerRole =
  | {
      id_rol: number | string;
      nombre: string;
      descripcion?: string | null;
      permisos?: Array<string | { module: string; action: string }>;
      created_at?: string;
      updated_at?: string;
    }
  | {
      id: number | string;
      name: string;
      description?: string | null;
      permissions?: Array<string | { module: string; action: string }>;
      createdAt?: string;
      updatedAt?: string;
    };

/** ============================
 *  Adaptadores DTO
 * ============================ */
function fromServer(r: ServerRole): Role {
  // Acepta ambas convenciones de claves
  const id =
    (r as any).id_rol ?? (r as any).id ?? (r as any).idRole ?? (r as any).idrole ?? "";
  const name =
    (r as any).nombre ?? (r as any).name ?? (r as any).rol ?? "Sin nombre";
  const description =
    (r as any).descripcion ?? (r as any).description ?? "" ;

  const createdAt =
    (r as any).created_at ?? (r as any).createdAt ?? new Date().toISOString();
  const updatedAt =
    (r as any).updated_at ?? (r as any).updatedAt ?? new Date().toISOString();

  const rawPerms =
    (r as any).permisos ?? (r as any).permissions ?? [];

  const permissions: Permission[] = [];
  if (Array.isArray(rawPerms)) {
    for (const p of rawPerms) {
      const dec = decodePerm(p);
      if (dec) permissions.push(dec);
    }
  }

  return {
    id: String(id),
    name,
    description: description ?? "",
    permissions,
    createdAt,
    updatedAt,
  };
}

function toServerCreate(input: RoleInput) {
  // Cuerpo mínimo compatible con backend existente
  return {
    nombre: input.name,
    descripcion: input.description ?? "",
    permisos: input.permissions.map(encodePerm), // ["roles:read", ...]
  };
}

function toServerUpdate(input: RoleInput) {
  return {
    nombre: input.name,
    descripcion: input.description ?? "",
    permisos: input.permissions.map(encodePerm),
  };
}

/** ============================
 *  API pública
 * ============================ */
export async function listRoles(): Promise<Role[]> {
  const res = await api.get("/roles");
  const data = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
  const mapped = data.map(fromServer);
  return sortByIdAsc(mapped);
}

export async function createRole(input: RoleInput): Promise<Role> {
  const res = await api.post("/roles", toServerCreate(input));
  return fromServer(res.data);
}

export async function updateRole(id: string, input: RoleInput): Promise<Role> {
  const res = await api.put(`/roles/${id}`, toServerUpdate(input));
  return fromServer(res.data);
}

export async function deleteRole(id: string): Promise<void> {
  await api.delete(`/roles/${id}`);
}

/** ============================
 *  Export/Import CSV en cliente
 *  (opcional si el backend ya lo hace)
 * ============================ */
export function exportRolesCSV(roles: Role[]): Blob {
  const headers = ["id", "name", "description", "permissions", "createdAt", "updatedAt"];
  const rows = sortByIdAsc(roles).map((r) => {
    const perms = r.permissions.map(encodePerm).join("|");
    const cols = [r.id, r.name, r.description ?? "", perms, r.createdAt, r.updatedAt];
    const escaped = cols.map((v) => `"${String(v).replace(/"/g, '""')}"`);
    return escaped.join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}

export async function importRolesCSV(file: File): Promise<Role[]> {
  // Import cliente: crea/actualiza usando el API uno por uno
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return listRoles();

  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, ""));
  const idx = (k: string) => headers.indexOf(k);
  const parseLine = (line: string): string[] => {
    const re = /("([^"]|"")*"|[^,]+)/g;
    const cols = line.match(re) || [];
    return cols.map((c) => c.replace(/^"|"$/g, "").replace(/""/g, `"`));
  };

  for (const line of lines.slice(1)) {
    const cols = parseLine(line);
    const name = cols[idx("name")] || "Sin nombre";
    const description = cols[idx("description")] || "";
    const perms = (cols[idx("permissions")] || "")
      .split("|")
      .filter(Boolean)
      .map((s) => decodePerm(s))
      .filter(Boolean) as Permission[];

    await createRole({ name, description, permissions: perms });
  }
  return listRoles();
}