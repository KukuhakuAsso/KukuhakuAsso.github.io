import { test } from "node:test";
import assert from "node:assert/strict";
import {
    normalizeAnswerLoose,
    normalizeAnswerStrict,
} from "../src/utils/answerNormalizer.js";

test("normalizeAnswerLoose: 去空格与标点并转大写", () => {
    assert.equal(normalizeAnswerLoose("Hello, World!"), "HELLOWORLD");
    assert.equal(normalizeAnswerLoose("空白 解谜"), "空白解谜");
});

test("normalizeAnswerLoose: 全角转半角", () => {
    // 全角 ＡＢＣ！ → 半角 ABC!
    assert.equal(normalizeAnswerLoose("ＡＢＣ！"), "ABC");
});

test("normalizeAnswerLoose: null/undefined 返回空串", () => {
    assert.equal(normalizeAnswerLoose(null), "");
    assert.equal(normalizeAnswerLoose(undefined), "");
});

test("normalizeAnswerStrict: 保留标点与大小写，合并空白", () => {
    assert.equal(normalizeAnswerStrict("Hello,   World!"), "Hello, World!");
    assert.equal(normalizeAnswerStrict("  前后空白  "), "前后空白");
});

test("normalizeAnswerStrict: 全角转半角但保留内容", () => {
    assert.equal(normalizeAnswerStrict("ＡＢＣ！"), "ABC!");
});
