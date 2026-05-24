/**
 * quickdb-shim.js
 * Drop-in replacement for quick.db v9 that uses a plain JSON file instead of
 * better-sqlite3 (which requires a native build unavailable in this env).
 *
 * Supported API (async, matching quick.db v9):
 *   new QuickDB({ filePath? })
 *   .set(key, value)  .get(key)  .has(key)  .delete(key)  .all()
 *   .push(key, value) .add(key, n) .sub(key, n)
 * Dot-notation paths are fully supported ("a.b.c").
 */

const fs = require('fs');
const path = require('path');

function getNestedValue(obj, parts) {
    let cur = obj;
    for (const p of parts) {
        if (cur == null || typeof cur !== 'object') return undefined;
        cur = cur[p];
    }
    return cur;
}

function setNestedValue(obj, parts, value) {
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (cur[p] == null || typeof cur[p] !== 'object') cur[p] = {};
        cur = cur[p];
    }
    cur[parts[parts.length - 1]] = value;
}

function deleteNestedValue(obj, parts) {
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (cur == null || typeof cur !== 'object') return;
        cur = cur[p];
    }
    if (cur && typeof cur === 'object') delete cur[parts[parts.length - 1]];
}

class QuickDB {
    constructor(options = {}) {
        this.filePath = options.filePath || path.join(process.cwd(), 'DataBaseJson', 'quickdb_data.json');
        if (!fs.existsSync(this.filePath)) {
            fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
            fs.writeFileSync(this.filePath, '{}', 'utf8');
        }
    }

    _read() {
        try { return JSON.parse(fs.readFileSync(this.filePath, 'utf8')); } catch { return {}; }
    }

    _write(data) {
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
    }

    async set(key, value) {
        const data = this._read();
        const parts = String(key).split('.');
        setNestedValue(data, parts, value);
        this._write(data);
        return value;
    }

    async get(key) {
        const data = this._read();
        const parts = String(key).split('.');
        return getNestedValue(data, parts) ?? null;
    }

    async has(key) {
        const val = await this.get(key);
        return val !== null && val !== undefined;
    }

    async delete(key) {
        const data = this._read();
        const parts = String(key).split('.');
        deleteNestedValue(data, parts);
        this._write(data);
        return true;
    }

    async all() {
        const data = this._read();
        return Object.entries(data).map(([id, value]) => ({ id, value }));
    }

    async push(key, value) {
        const current = await this.get(key);
        const arr = Array.isArray(current) ? current : [];
        arr.push(value);
        return this.set(key, arr);
    }

    async add(key, amount) {
        const current = await this.get(key);
        const num = (typeof current === 'number' ? current : 0) + (Number(amount) || 0);
        return this.set(key, num);
    }

    async sub(key, amount) {
        return this.add(key, -(Number(amount) || 0));
    }

    table(name) {
        const dir = path.dirname(this.filePath);
        const base = path.basename(this.filePath, '.json');
        return new QuickDB({ filePath: path.join(dir, `${base}_${name}.json`) });
    }
}

module.exports = { QuickDB };
