export const ROLES = Object.freeze({
  EMPLOYEE: 'EMPLOYEE',
  HR_MANAGER: 'HR_MANAGER',
  HR_PAYROLL_USER: 'HR_PAYROLL_USER',
  HR_PAYROLL_MANAGER: 'HR_PAYROLL_MANAGER',
  ADMIN: 'ADMIN',
});

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));

export const isCanonicalRole = (role) => ROLE_VALUES.includes(role);
