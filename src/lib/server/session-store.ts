import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { DomainError } from "../domain/errors";
import {
  type MirrorSession,
  MirrorSessionSchema,
  type SessionDatabase,
  SessionDatabaseSchema,
} from "../domain/schemas";

const EMPTY_DATABASE: SessionDatabase = { version: 1, sessions: {} };

const isMissingFileError = (error: unknown): boolean =>
  error instanceof Error &&
  "code" in error &&
  (error as Error & { readonly code: unknown }).code === "ENOENT";

export interface SessionStore {
  insert(session: MirrorSession): Promise<MirrorSession>;
  findById(id: string): Promise<MirrorSession | null>;
  update(id: string, updater: (session: MirrorSession) => MirrorSession): Promise<MirrorSession>;
  delete(id: string): Promise<boolean>;
}

export class JsonSessionStore implements SessionStore {
  private pending: Promise<void> = Promise.resolve();

  public readonly filePath: string;

  public constructor(filePath?: string) {
    const configured = filePath ?? process.env.MIRROR_DATA_FILE;
    this.filePath =
      configured !== undefined && path.isAbsolute(configured)
        ? configured
        : path.join(process.cwd(), ".data", path.basename(configured ?? "mirror-sessions.json"));
  }

  private async serialized<T>(operation: () => Promise<T>): Promise<T> {
    const previous = this.pending;
    let release: () => void = () => undefined;
    this.pending = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }

  private async readDatabase(): Promise<SessionDatabase> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsedJson: unknown = JSON.parse(raw);
      const parsed = SessionDatabaseSchema.safeParse(parsedJson);
      if (!parsed.success) {
        throw new DomainError("会话数据文件无法通过结构校验。", "PERSISTENCE_ERROR", 500);
      }
      return parsed.data;
    } catch (error: unknown) {
      if (isMissingFileError(error)) {
        return EMPTY_DATABASE;
      }
      if (error instanceof DomainError) {
        throw error;
      }
      throw new DomainError("读取会话数据时发生错误。", "PERSISTENCE_ERROR", 500);
    }
  }

  private async writeDatabase(database: SessionDatabase): Promise<void> {
    const validDatabase = SessionDatabaseSchema.parse(database);
    const directory = path.dirname(this.filePath);
    const temporaryFile = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`;
    await mkdir(directory, { recursive: true, mode: 0o700 });

    try {
      await writeFile(temporaryFile, `${JSON.stringify(validDatabase, null, 2)}\n`, {
        encoding: "utf8",
        mode: 0o600,
      });
      await rename(temporaryFile, this.filePath);
    } catch {
      await unlink(temporaryFile).catch(() => undefined);
      throw new DomainError("保存会话数据时发生错误。", "PERSISTENCE_ERROR", 500);
    }
  }

  public insert(session: MirrorSession): Promise<MirrorSession> {
    return this.serialized(async () => {
      const database = await this.readDatabase();
      if (database.sessions[session.id] !== undefined) {
        throw new DomainError("会话 ID 已存在。", "CONFLICT", 409);
      }
      const validated = MirrorSessionSchema.parse(session);
      await this.writeDatabase({
        ...database,
        sessions: { ...database.sessions, [validated.id]: validated },
      });
      return validated;
    });
  }

  public findById(id: string): Promise<MirrorSession | null> {
    return this.serialized(async () => {
      const database = await this.readDatabase();
      return database.sessions[id] ?? null;
    });
  }

  public update(
    id: string,
    updater: (session: MirrorSession) => MirrorSession,
  ): Promise<MirrorSession> {
    return this.serialized(async () => {
      const database = await this.readDatabase();
      const current = database.sessions[id];
      if (current === undefined) {
        throw new DomainError("没有找到这次探索。", "NOT_FOUND", 404);
      }

      const updated = MirrorSessionSchema.parse(updater(current));
      if (updated.id !== id) {
        throw new DomainError("不能修改会话 ID。", "CONFLICT", 409);
      }
      await this.writeDatabase({
        ...database,
        sessions: { ...database.sessions, [id]: updated },
      });
      return updated;
    });
  }

  public delete(id: string): Promise<boolean> {
    return this.serialized(async () => {
      const database = await this.readDatabase();
      if (database.sessions[id] === undefined) {
        return false;
      }

      const sessions = { ...database.sessions };
      delete sessions[id];
      await this.writeDatabase({ ...database, sessions });
      return true;
    });
  }
}

let defaultStore: SessionStore | undefined;

export function getDefaultSessionStore(): SessionStore {
  defaultStore ??= new JsonSessionStore();
  return defaultStore;
}
