export const ROLES = Object.freeze({
  ADMIN: 'admin',
  SUPPLIER: 'supplier',
  RETAILER: 'buyer',
})

export const ROLE_LABELS = Object.freeze({
  [ROLES.ADMIN]: 'Admin',
  [ROLES.SUPPLIER]: 'Supplier / Manufacturer',
  [ROLES.RETAILER]: 'Retailer',
})

export const ROLE_HOME = Object.freeze({
  [ROLES.ADMIN]: '/admin',
  [ROLES.SUPPLIER]: '/supplier',
  [ROLES.RETAILER]: '/dashboard',
})

export function normalizeRole(role){
  const normalized = String(role || '').toLowerCase()
  if (normalized === 'manufacturer') return ROLES.SUPPLIER
  if (normalized === 'retailer') return ROLES.RETAILER
  return normalized
}

export function canAccessRole(user, allowedRoles = []){
  if (!user) return false
  const role = normalizeRole(user.role)
  if (role === ROLES.ADMIN) return true
  return allowedRoles.length === 0 || allowedRoles.includes(role)
}

export function getUserRoleHome(user){
  if (!user) return '/login'
  const role = normalizeRole(user.role)
  return ROLE_HOME[role] || '/dashboard'
}
