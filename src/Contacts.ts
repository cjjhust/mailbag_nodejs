import * as path from "path";
const Datastore = require("nedb");
export interface IContact {
    _id?: number, name: string, email: string
}
export class Worker {
    private db: Nedb;
    constructor() {
        this.db = new Datastore({
            filename: path.join(__dirname, "contacts.db"),
            autoload: true
        });
    };

    public listContacts(): Promise<IContact[]> {
        return new Promise((inResolve, inReject) => {
            this.db.find({},
                (inError: Error, inDocs: IContact[]) => {
                    if (inError) {
                        inReject(inError);
                    } else {
                        inResolve(inDocs);
                    }
                }
            );
        });
    };
    public addContact(inContact: IContact): Promise<IContact> {
        return new Promise((inResolve, inReject) => {
            this.db.insert(inContact,
                (inError: Error | null, inNewDoc: IContact) => {
                    if (inError) {
                        inReject(inError);
                    } else {
                        inResolve(inNewDoc);
                    }
                }
            );
        });
    };
    public deleteContact(inID: string): Promise<void> {
        return new Promise((inResolve, inReject) => {
            this.db.remove({ _id: parseInt(inID, 10) }, {},
                (inError: Error | null,inNumRemoved: number) => {
                    if (inError) {
                        // 在 TypeScript 中，如果 inError 是 Error | null，
                        // 在 if(inError) 块内，inError 会被自动推断为 Error 类型。
                        inReject(inError);
                    } else {
                        // 建议 resolve 一个值或使用 Promise<void>
                        inResolve();
                    }
                }
            );
        });
    };
}
