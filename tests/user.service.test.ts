import assert from "node:assert/strict";
import test from "node:test";
import { compare } from "bcryptjs";
import type { Prisma, User } from "../generated/prisma/client";
import userRepository from "../src/repositories/user.repository";
import userService from "../src/services/user.service";

const storedUser: User = {
  id: 1,
  email: "jane@example.com",
  name: "Jane Doe",
  password: "stored-password",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

test("getAll omits passwords from returned users", async () => {
  const originalGetAll = userRepository.getAll;
  userRepository.getAll = async () => [storedUser];

  try {
    const users = await userService.getAll();

    assert.equal(users.length, 1);
    assert.equal(users[0]?.email, storedUser.email);
    assert.equal("password" in users[0]!, false);
  } finally {
    userRepository.getAll = originalGetAll;
  }
});

test("create hashes the password and omits it from the returned user", async () => {
  const originalFindByEmail = userRepository.findByEmail;
  const originalCreate = userRepository.create;
  let persistedData: Prisma.UserCreateInput | undefined;

  userRepository.findByEmail = async () => null;
  userRepository.create = async (data) => {
    persistedData = data;
    return { ...storedUser, password: data.password };
  };

  try {
    const user = await userService.create({
      email: storedUser.email,
      name: storedUser.name,
      password: "plain-text-password",
    });

    assert.ok(persistedData);
    assert.notEqual(persistedData.password, "plain-text-password");
    assert.equal(await compare("plain-text-password", persistedData.password), true);
    assert.equal("password" in user, false);
  } finally {
    userRepository.findByEmail = originalFindByEmail;
    userRepository.create = originalCreate;
  }
});

test("update hashes a new password and omits it from the returned user", async () => {
  const originalUpdate = userRepository.update;
  let persistedData: Prisma.UserUpdateInput | undefined;

  userRepository.update = async (_id, data) => {
    persistedData = data;
    return { ...storedUser, password: data.password as string };
  };

  try {
    const user = await userService.update(storedUser.id, {
      password: "replacement-password",
    });

    assert.ok(persistedData);
    assert.equal(typeof persistedData.password, "string");
    assert.notEqual(persistedData.password, "replacement-password");
    assert.equal(await compare("replacement-password", persistedData.password as string), true);
    assert.equal("password" in user, false);
  } finally {
    userRepository.update = originalUpdate;
  }
});
