import { test } from "node:test";
import assert from "node:assert/strict";
import { getObjectHash } from "../src/utils/simpleHash.js";

test("getObjectHash: 键顺序不同的相同对象应得到相同哈希", () => {
    const a = { name: "空白", level: 1, tags: ["ARG", "puzzle"] };
    const b = { tags: ["ARG", "puzzle"], level: 1, name: "空白" };
    assert.equal(getObjectHash(a), getObjectHash(b));
});

test("getObjectHash: 值不同的对象应得到不同哈希", () => {
    const a = { name: "空白", level: 1 };
    const b = { name: "空白", level: 2 };
    assert.notEqual(getObjectHash(a), getObjectHash(b));
});

test("getObjectHash: 嵌套对象键顺序无关", () => {
    const a = { meta: { x: 1, y: 2 }, list: [1, 2, 3] };
    const b = { list: [1, 2, 3], meta: { y: 2, x: 1 } };
    assert.equal(getObjectHash(a), getObjectHash(b));
});

test("getObjectHash: 返回值为 16 进制字符串", () => {
    const h = getObjectHash({ a: 1 });
    assert.match(h, /^[0-9a-f]+$/);
});
