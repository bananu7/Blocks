export default class Map {
    constructor() {
        this._data = {};
    }

    at (key, value) {
        if (value !== undefined) {
            this._data[key] = value;
        }

        return this._data[key];
    }

    insert(key, value) {
        if (this.at(key)) {
            return false;
        } else {
            this._data[key] = value;
            return true;
        }
    }

    remove(key) {
        this._data[key] = undefined;
    }

    *keys() {
        for(var key in this._data) {
            yield key;
        }
    }

    *values() {
        for(var key in this._data) {
            yield this._data[key];
        }
    }

    *pairs() {
        for(var key in this._data) {
            yield [key, this._data[key]];
        }
    }
}
