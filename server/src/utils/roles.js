/** User.roles 는 콤마로 구분된 문자열 ("BUYER,SELLER") 로 저장된다 */
export function parseRoles(roles) {
  return (roles ?? '').split(',').filter(Boolean);
}

export function hasRole(user, role) {
  return parseRoles(user.roles).includes(role);
}

/** 기존 roles 문자열에 role 을 더한 새 문자열을 돌려준다 (이미 있으면 그대로) */
export function addRole(existingRoles, role) {
  const set = new Set(parseRoles(existingRoles));
  set.add(role);
  return [...set].join(',');
}
