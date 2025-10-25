import { ParsedMail, simpleParser } from "mailparser";
import { IServerInfo } from "./ServerInfo";
import { Readable } from "stream";
// 恢复：使用 require 导入，这是处理这类模块最直接的方式
const Imap = require("node-imap");

const CONNECTION_TIMEOUT_MS = 30000;
// 最终后备方案：手动解析 DNS
const dns = require('dns'); // 建议使用 import dns from 'dns';
const { promisify } = require('util');

const lookupAsync = promisify(dns.lookup);

export interface ICallOptions {
    mailbox: string,
    id?: number
}

export interface IMessage {
    id: string,
    date: string,
    from: string,
    subject: string, 
    body?: string
}

export interface IMailbox { name: string, path: string }

export class Worker {
    private static serverInfo: IServerInfo;

    constructor(inServerInfo: IServerInfo) {
        Worker.serverInfo = inServerInfo;
    }

    /**
     * Connects to the IMAP server and returns a Promise that resolves with the connection object.
     */
    private connectToServer(): Promise<any> {
        return new Promise((resolve, reject) => {
            lookupAsync(Worker.serverInfo.imap.host, 4).then((result: { address: string; }) => {
                 const ipAddress = result.address;
                 console.log(`DNS resolved ${Worker.serverInfo.imap.host} to IP: ${ipAddress}`);
 
                 const imap = new Imap({
                     user: Worker.serverInfo.imap.auth.user,
                     password: Worker.serverInfo.imap.auth.pass,
                     host: ipAddress,
                     port: Worker.serverInfo.imap.port,
                     tls: true,
                     connTimeout: CONNECTION_TIMEOUT_MS,
                     tlsOptions: {
                         rejectUnauthorized: false,
                         servername: Worker.serverInfo.imap.host
                     }
                 });
 
                 imap.once('ready', () => {
                     resolve(imap); // 连接成功，返回实例
                 });
 
                 imap.once('error', (err: Error) => {
                     reject(new Error(`IMAP Connection failed: ${err.message}`));
                 });
 
                 imap.connect();
             }).catch((inError: any) => {
                 reject(new Error(`DNS lookup failed: ${inError}`));
             });
        });
    }

    public async listMailboxes(): Promise<IMailbox[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const imap = await this.connectToServer();
                imap.getBoxes((err: Error | null, boxes: any) => { // 修复：为回调参数添加类型
                    if (err) {
                        imap.end();
                        return reject(err);
                    }
                    const finalMailboxes: IMailbox[] = [];
                    const iterateBoxes = (boxObject: any, pathPrefix: string): void => {
                        Object.keys(boxObject).forEach(key => {
                            const currentPath = pathPrefix ? `${pathPrefix}${boxObject[key].delimiter}${key}` : key;
                            finalMailboxes.push({ name: key, path: currentPath });
                            if (boxObject[key].children) {
                                iterateBoxes(boxObject[key].children, currentPath);
                            }
                        });
                    };
                    iterateBoxes(boxes, "");
                    imap.end();
                    resolve(finalMailboxes);
                });
            } catch (inError: any) {
                reject(inError);
            }
        });
    }

    public async listMessages(inCallOptions: ICallOptions): Promise<IMessage[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const imap = await this.connectToServer();
                imap.openBox(inCallOptions.mailbox, true, (err: Error | null, box: any) => { // 修复：为回调参数添加类型
                    if (err) { imap.end(); return reject(err); }
                    if (box.messages.total === 0) { imap.end(); return resolve([]); }

                    const fetch = imap.seq.fetch("1:*", { bodies: "HEADER.FIELDS (FROM SUBJECT DATE)", struct: true });
                    const messages: IMessage[] = [];
                    fetch.on("message", (msg: any, seqno: number) => { // 修复：为回调参数添加类型
                        const message: Partial<IMessage> = { id: seqno.toString() };
                        messages.push(message as IMessage);

                        msg.on("body", (stream: Readable) => {
                            simpleParser(stream, (err: Error | null, parsed: ParsedMail) => { // 修复：为回调参数添加类型
                                if (err) { return; }
                                message.from = parsed.from?.text ?? "N/A";
                                message.subject = parsed.subject ?? "N/A";
                                message.date = parsed.date?.toISOString();
                            });
                        });
                        msg.once("attributes", (attrs: any) => { // 修复：为回调参数添加类型
                            message.id = attrs.uid.toString();
                        });
                    });
                    fetch.once("error", (err: Error) => { imap.end(); reject(err); }); // 修复：为回调参数添加类型
                    fetch.once("end", () => {
                        imap.end();
                        messages.sort((a, b) => parseInt(b.id) - parseInt(a.id));
                        resolve(messages);
                    });
                });
            } catch (inError: any) {
                reject(inError);
            }
        });
    }

    public async getMessageBody(inCallOptions: ICallOptions): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const imap = await this.connectToServer();
                imap.openBox(inCallOptions.mailbox, true, (err: Error | null) => { // 修复：为回调参数添加类型
                    if (err) { imap.end(); return reject(err); }

                    const fetch = imap.fetch(inCallOptions.id!.toString(), { bodies: "" });
                    fetch.on("message", (msg: any) => { // 修复：为回调参数添加类型
                        msg.on("body", (stream: Readable) => {
                            simpleParser(stream, (err: Error | null, parsed: ParsedMail) => { // 修复：为回调参数添加类型
                                if (err) { imap.end(); return reject(err); }
                                imap.end();
                                resolve(parsed.text || "");
                            });
                        });
                    });
                    fetch.once("error", (err: Error) => { imap.end(); reject(err); }); // 修复：为回调参数添加类型
                });
            } catch (inError: any) {
                reject(inError);
            }
        });
    }

    public async deleteMessage(inCallOptions: ICallOptions): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const imap = await this.connectToServer();
                imap.openBox(inCallOptions.mailbox, false, (err: Error | null) => { // 修复：为回调参数添加类型
                    if (err) { imap.end(); return reject(err); }

                    imap.addFlags(inCallOptions.id!.toString(), "\\Deleted", (err: Error | null) => { // 修复：为回调参数添加类型
                        imap.end();
                        if (err) { return reject(err); }
                        resolve();
                    });
                });
            } catch (inError: any) {
                reject(inError);
            }
        });
    }
}
