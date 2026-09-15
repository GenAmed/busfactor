// Tests for the lockfile parsers. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseNpmLock } from "../src/lockfiles/npm.js";
import { parseRequirementsTxt, parsePoetryLock, normalizePypiName } from "../src/lockfiles/pypi.js";
import { parseCargoLock } from "../src/lockfiles/cargo.js";
import { parseGoSum } from "../src/lockfiles/go.js";
import { loadLockfile } from "../src/lockfiles/index.js";

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");
const read = (name) => readFileSync(path.join(fixtures, name), "utf8");

test("npm: package-lock v3 gives unique names, scoped, aliased, no root, no workspace links", () => {
  const names = parseNpmLock(read("package-lock.json"));
  assert.deepEqual(names, ["@babel/core", "foo", "lodash", "real-name"]);
});

test("npm: lockfile v1 is rejected with a helpful message", () => {
  assert.throws(() => parseNpmLock('{"lockfileVersion":1,"dependencies":{}}'), /lockfileVersion 1/);
});

test("pypi: requirements.txt keeps names only, normalised", () => {
  const names = parseRequirementsTxt(read("requirements.txt"));
  assert.deepEqual(names, ["celery", "django", "pillow-fork", "requests"]);
});

test("pypi: poetry.lock reads [[package]] blocks only", () => {
  const names = parsePoetryLock(read("poetry.lock"));
  assert.deepEqual(names, ["requests", "typing-extensions"]);
});

test("pypi: name normalisation follows PEP 503", () => {
  assert.equal(normalizePypiName("Foo_Bar.baz"), "foo-bar-baz");
});

test("cargo: Cargo.lock skips workspace members without a source", () => {
  assert.deepEqual(parseCargoLock(read("Cargo.lock")), ["atty", "serde"]);
});

test("go: go.sum de-duplicates module paths", () => {
  assert.deepEqual(parseGoSum(read("go.sum")), ["github.com/pkg/errors", "gopkg.in/yaml.v3"]);
});

test("loadLockfile: picks package-lock.json first in a folder and marks npm as analysed", () => {
  const lock = loadLockfile(fixtures);
  assert.equal(lock.ecosystem, "npm");
  assert.equal(lock.analysed, true);
  assert.equal(lock.packages.length, 4);
});

test("loadLockfile: accepts a direct file path and flags not-yet-analysed ecosystems", () => {
  const lock = loadLockfile(path.join(fixtures, "go.sum"));
  assert.equal(lock.ecosystem, "go");
  assert.equal(lock.analysed, false);
});

test("loadLockfile: explains when nothing is found", () => {
  assert.throws(() => loadLockfile(path.join(fixtures, "nope")), /no lockfile found/);
});
