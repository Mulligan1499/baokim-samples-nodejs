/**
 * Config Manager
 * Quản lý cấu hình, ưu tiên load từ config.local.js
 */

const fs = require('fs');
const path = require('path');

let config = null;

/**
 * Load config từ file
 */
function load() {
    const localConfigPath = path.join(__dirname, '../config/config.local.js');
    const defaultConfigPath = path.join(__dirname, '../config/config.js');

    if (fs.existsSync(localConfigPath)) {
        config = require(localConfigPath);
    } else if (fs.existsSync(defaultConfigPath)) {
        config = require(defaultConfigPath);
    } else {
        throw new Error('Config file not found');
    }

    return config;
}

/**
 * Lấy giá trị config
 * @param {string} key 
 * @param {*} defaultValue 
 */
function get(key, defaultValue = null) {
    if (!config) {
        load();
    }
    return config[key] !== undefined ? config[key] : defaultValue;
}

/**
 * Lấy toàn bộ config
 */
function getAll() {
    if (!config) {
        load();
    }
    return config;
}

module.exports = {
    load,
    get,
    getAll
};
