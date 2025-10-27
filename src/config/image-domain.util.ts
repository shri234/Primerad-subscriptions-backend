export class ImageDomainHelper {
  constructor(private readonly domain: string) {}

  appendImageDomain<T extends Record<string, any>>(entity: T): T {
    if (!entity) return entity;

    const e = entity as any; 

    if (e.imageUrl && typeof e.imageUrl === 'string' && !e.imageUrl.startsWith('http')) {
      e.imageUrl = `${this.domain}${e.imageUrl}`;
    }

    if (Array.isArray(e.faculty)) {
      e.faculty = e.faculty.map((f: any) => {
        if (f?.image && typeof f.image === 'string' && !f.image.startsWith('http')) {
          f.image = `${this.domain}${f.image}`;
        }
        return f;
      });
    }

    if (Array.isArray(e.sessions)) {
      e.sessions = e.sessions.map((s: any) => this.appendImageDomain(s));
    }

    return e;
  }

  appendImageDomainToMany<T extends Record<string, any>>(entities: T[]): T[] {
    return entities.map((e) => this.appendImageDomain(e));
  }
}
