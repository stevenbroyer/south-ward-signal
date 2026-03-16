const NYRB_NAMES = ['Red Bull New York', 'New York Red Bulls', 'New York RB', 'NYRB', 'NY Red Bulls'];

export function isNYRB(name: string): boolean {
  return NYRB_NAMES.some((n) => name.includes(n)) || name.includes('Red Bull') || name === 'RBNY';
}
