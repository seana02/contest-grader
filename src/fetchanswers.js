// fetch-page.ts
import { writeFileSync } from "fs";
import { JSDOM } from "jsdom";

function writeJson(path, data) {
    writeFileSync(path, JSON.stringify(data, null, 2));
}

const types = ["10A", "10B", "12A", "12B"];

const answers = {};
for (let y = 2002; y <= 2026; y++) {
    if (y == 2021) {
        answers["2021 Spring"] = {};
        for (let t = 0; t <= 3; t++) {
            answers["2021 Spring"][`AMC${types[t]}`] = [];
        }
        answers["2021 Fall"] = {};
        for (let t = 0; t <= 3; t++) {
            answers["2021 Fall"][`AMC${types[t]}`] = [];
        }
        continue;
    }
    answers[y] = {};
    for (let t = 0; t <= 3; t++) {
        answers[y][`AMC${types[t]}`] = []
    }
}

writeJson('./answers.json', answers);
