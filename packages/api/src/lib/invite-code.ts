// Invite code generation for households

const ALLOWED_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Avoid confusing characters (O/0, I/1)
const CODE_LENGTH = 8

export function generateInviteCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALLOWED_CHARS.charAt(Math.floor(Math.random() * ALLOWED_CHARS.length))
  }
  return code
}

export { ALLOWED_CHARS, CODE_LENGTH }
