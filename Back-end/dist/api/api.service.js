"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const axios_2 = require("axios");
const BASE_URL = "https://api.intra.42.fr";
const CLIENT_ID = "u-s4t2ud-68346e25a5e2e6dfab2d06f70bc9693aa84084e271c194a8d32a84e5d2d6ab57";
const CLIENT_SECRET = "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";
let ApiService = class ApiService {
    constructor(httpService) {
        this.httpService = httpService;
    }
    postToExternalApi(data) {
        const url = `${BASE_URL}/oauth/token` +
            `?grant_type=authorization_code` +
            `&client_id=${CLIENT_ID}` +
            `&client_secret=${CLIENT_SECRET}` +
            `&code=${data.code}` +
            `&redirect_uri=${process.env.FRONTEND_URL}:${process.env.FRONTEND_PORT}`;
        return axios_2.default.post(url);
    }
    getFromExternalApi(token) {
        const url = `${BASE_URL}/v2/me`;
        return axios_2.default.get(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    }
};
exports.ApiService = ApiService;
exports.ApiService = ApiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], ApiService);
//# sourceMappingURL=api.service.js.map