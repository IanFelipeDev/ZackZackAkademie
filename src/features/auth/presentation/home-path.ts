import { isStaff, type Role } from '../domain/role';

export const STUDENT_HOME_PATH = '/treino';
export const STAFF_HOME_PATH = '/revisoes';

export function homePathFor(role: Role): string {
  return isStaff(role) ? STAFF_HOME_PATH : STUDENT_HOME_PATH;
}
