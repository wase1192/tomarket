import colors from "colors";
import he from "he";
import { parse } from "querystring";
import fileHelper from "../helpers/file.js";
import { LogHelper } from "../helpers/log.js";
import server from "../services/server.js";
import { HttpService } from "./http.js";

class UserService {
  constructor() {}

  safeDecodeURIComponent(str) {
    return str.replace(/(%[0-9A-F]{2})+/gi, (match) => {
      try {
        return decodeURIComponent(match);
      } catch (e) {
        return match; // Nếu có lỗi, giữ nguyên phần này
      }
    });
  }

  async loadUser() {
    const rawUsers = fileHelper.readFile("users.txt");
    const rawProxies = fileHelper.readFile("proxy.txt");
    const rawWallets = fileHelper.readFile("wallet.txt");

    const users = rawUsers
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const proxies = rawProxies
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    let wallets = [];
    if (rawWallets) {
      wallets = rawWallets.split("\n").map((line) => line.trim());
    }

    if (users.length <= 0) {
      console.log(colors.red(`Không tìm thấy dữ liệu user`));
      return [];
    } else {
      let database = {};
      database = await server.getData();
      database["ref"] = database?.ref || "0000cwVd";

      const result = users.map((user, index) => {
        const userParse = parse(he.decode(this.safeDecodeURIComponent(user)));
        const info = JSON.parse(userParse.user);
        const proxy = proxies[index] || null;
        const log = new LogHelper(index + 1, info.id);
        const http = new HttpService(log, proxy);
        let wallet = null;
        if (wallets[index]) {
          wallet = wallets[index];
        }
        let query_id = user;
        if (user && user.includes("query_id%3D")) {
          query_id = he.decode(decodeURIComponent(query_id));
        }

        return {
          query_id,
          index: index + 1,
          info: {
            ...info,
            fullName: (info.first_name + " " + info.last_name).trim(),
            auth_date: userParse.auth_date,
            hash: userParse.hash,
          },
          database,
          proxy,
          http,
          log,
          currency: " 🍅",
          wallet,
        };
      });

      return result;
    }
  }
}

const userService = new UserService();
export default userService;
