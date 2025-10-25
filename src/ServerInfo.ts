import path from "path";
import fs from "fs";
export interface IServerInfo {
    smtp: {
        host: string, port: number,
        auth: { user: string, pass: string }
    },
    imap: {
        host: string, port: number,
        auth: { user: string, pass: string }
    }
}

// Read the server info file.
const rawInfo = fs.readFileSync(path.join(__dirname, "../serverInfo.json"));

// Parse the JSON and export it.
export const serverInfo: IServerInfo = JSON.parse(rawInfo.toString());
