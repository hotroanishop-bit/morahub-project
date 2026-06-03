// Password utility with bcrypt fallback to bcryptjs
export async function hashPassword(password: string): Promise<string> {
  try {
    const bcrypt = await import("bcrypt");
    return await bcrypt.hash(password, 12);
  } catch {
    const bcryptjs = await import("bcryptjs");
    return await bcryptjs.hash(password, 12);
  }
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    const bcrypt = await import("bcrypt");
    return await bcrypt.compare(password, hash);
  } catch {
    const bcryptjs = await import("bcryptjs");
    return await bcryptjs.compare(password, hash);
  }
}
