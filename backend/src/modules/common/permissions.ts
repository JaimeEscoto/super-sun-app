import { PermissionMatrix } from './types.js';

export const permissions: PermissionMatrix = {
  ADMINISTRADOR: [
    'catalogos:ver',
    'catalogos:crear',
    'catalogos:editar',
    'catalogos:aprobar',
    'catalogos:anular',
    'inventario:ver',
    'inventario:movimientos',
    'compras:gestionar',
    'ventas:gestionar',
    'facturacion:emitir',
    'contabilidad:libros',
    'contabilidad:asientos',
    'reportes:ver',
    'usuarios:gestionar'
  ],
  CONTADOR: [
    'catalogos:ver',
    'facturacion:emitir',
    'contabilidad:libros',
    'contabilidad:asientos',
    'reportes:ver'
  ],
  VENTAS: [
    'catalogos:ver',
    'ventas:gestionar',
    'reportes:ver'
  ],
  COMPRAS: [
    'catalogos:ver',
    'compras:gestionar',
    'reportes:ver'
  ],
  ALMACEN: [
    'catalogos:ver',
    'inventario:movimientos',
    'inventario:ver'
  ],
  AUDITOR: ['reportes:ver', 'catalogos:ver', 'contabilidad:libros']
};
