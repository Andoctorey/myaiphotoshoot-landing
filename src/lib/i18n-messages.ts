export async function loadMessages(locale: string) {
  try {
    return (await import(`../../messages/${locale}/index.json`)).default as Record<string, unknown>;
  } catch {
    return (await import(`../../messages/en/index.json`)).default as Record<string, unknown>;
  }
}


