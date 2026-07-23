import { afterAll, afterEach, describe, expect, it } from "vitest";
import { disconnectDatabase, resetDatabase } from "@/test/integration/helpers";
import { UserRepository } from "./user-repository";

describe("UserRepository (integration)", () => {
  const repository = new UserRepository();

  const createUserParams = () => ({
    name: "Jane Doe",
    email: `jane-${crypto.randomUUID()}@example.com`,
    password: "$2b$10$hashedpasswordplaceholderfortests",
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(() => disconnectDatabase());

  it("create persists a new user", async () => {
    const params = createUserParams();

    const created = await repository.create(params);

    expect(created).toMatchObject({
      name: params.name,
      email: params.email,
      password: params.password,
      externalId: null,
    });
    expect(created.id).toBeGreaterThan(0);
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
  });

  it("getByEmail returns user by email", async () => {
    const params = createUserParams();
    const created = await repository.create(params);

    const found = await repository.getByEmail(params.email);

    expect(found).toMatchObject({
      id: created.id,
      email: params.email,
      name: params.name,
    });
  });

  it("getByEmail returns null when email is unknown", async () => {
    const found = await repository.getByEmail("unknown@example.com");

    expect(found).toBeNull();
  });

  it("getById returns user by id", async () => {
    const params = createUserParams();
    const created = await repository.create(params);

    const found = await repository.getById(created.id);

    expect(found).toMatchObject({
      id: created.id,
      email: params.email,
    });
  });

  it("getById returns null when id does not exist", async () => {
    const found = await repository.getById(999_999);

    expect(found).toBeNull();
  });

  it("update changes user fields", async () => {
    const params = createUserParams();
    const created = await repository.create(params);
    const newPassword = "$2b$10$newhashplaceholderfortests";

    const updated = await repository.update(created.id, {
      password: newPassword,
    });

    expect(updated.id).toBe(created.id);
    expect(updated.password).toBe(newPassword);

    const reloaded = await repository.getById(created.id);
    expect(reloaded?.password).toBe(newPassword);
  });

  it("updateInterviewLocale persists locale visible via getById and getByEmail", async () => {
    const params = createUserParams();
    const created = await repository.create(params);

    expect(created.interviewLocale).toBeNull();

    const updated = await repository.updateInterviewLocale(created.id, "pt");

    expect(updated).toMatchObject({
      id: created.id,
      email: params.email,
      interviewLocale: "pt",
    });

    const byId = await repository.getById(created.id);
    expect(byId?.interviewLocale).toBe("pt");

    const byEmail = await repository.getByEmail(params.email);
    expect(byEmail?.interviewLocale).toBe("pt");
  });

  it("upsertFromBorderless creates a user and preserves interviewLocale on update", async () => {
    const created = await repository.upsertFromBorderless({
      externalId: "ext-100",
      email: "borderless@example.com",
      name: "Borderless User",
    });

    expect(created.externalId).toBe("ext-100");
    expect(created.password).toBeNull();

    await repository.updateInterviewLocale(created.id, "pt");

    const updated = await repository.upsertFromBorderless({
      externalId: "ext-100",
      email: "borderless@example.com",
      name: "Updated Name",
    });

    expect(updated.name).toBe("Updated Name");
    expect(updated.interviewLocale).toBe("pt");
  });

  it("upsertFromBorderless links existing email row to externalId", async () => {
    const existing = await repository.create({
      name: "Local",
      email: "link@example.com",
      password: null,
    });

    const linked = await repository.upsertFromBorderless({
      externalId: "ext-link",
      email: "link@example.com",
      name: "Linked",
    });

    expect(linked.id).toBe(existing.id);
    expect(linked.externalId).toBe("ext-link");
    expect(linked.name).toBe("Linked");
  });
});
