import path from "path";
import express,{ Express, NextFunction, Request, Response } from "express";
import { serverInfo } from "./ServerInfo";
import * as IMAP from "./IMAP";
import * as SMTP from "./SMTP";
import * as Contacts from "./Contacts";
import { IContact } from "./Contacts";
const app: Express = express();
app.use(express.json());
app.use("/",
    express.static(path.join(__dirname, "../client/dist"))
);
app.use(function (inRequest: Request, inResponse: Response,
    inNext: NextFunction) {
    inResponse.header("Access-Control-Allow-Origin", "*");
    inResponse.header("Access-Control-Allow-Methods",
        "GET,POST,DELETE,OPTIONS"
    );
    inResponse.header("Access-Control-Allow-Headers",
        "Origin,X-Requested-With,Content-Type,Accept"
    );
    inNext();
});
app.get("/mailboxes",
    async (inRequest: Request, inResponse: Response) => {
        try {
            const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
            const mailboxes: IMAP.IMailbox[] = await imapWorker.listMailboxes();
            inResponse.json(mailboxes);
        } catch (inError) {
            console.error("GET /mailboxes Error:", inError);
            inResponse.status(500).send("error");
        }
    }
);

app.get("/mailboxes/:mailbox",
    async (inRequest: Request, inResponse: Response) => {
        try {
            const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
            const messages: IMAP.IMessage[] = await imapWorker.listMessages({
                mailbox: inRequest.params.mailbox
            });
            inResponse.json(messages);
        } catch (inError) {
            console.error(`GET /mailboxes/${inRequest.params.mailbox} Error:`, inError);
            inResponse.status(500).send("error");
        }
    }
);
app.get("/mailboxes/:mailbox/:id",
    async (inRequest: Request, inResponse: Response) => {
        try {
            const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
            const messageBody: string = await imapWorker.getMessageBody({
                mailbox: inRequest.params.mailbox,
                id: parseInt(inRequest.params.id, 10)
            });
            inResponse.send(messageBody);
        } catch (inError) {
            console.error(`GET /messages/${inRequest.params.mailbox}/${inRequest.params.id} Error:`, inError);
            inResponse.status(500).send("error");
        }
    }
);
app.delete("/mailboxes/:mailbox/:id",
    async (inRequest: Request, inResponse: Response) => {
        try {
            const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
            await imapWorker.deleteMessage({
                mailbox: inRequest.params.mailbox,
                id: parseInt(inRequest.params.id, 10)
            });
            inResponse.send("ok");
        } catch (inError) {
            console.error(`DELETE /messages/${inRequest.params.mailbox}/${inRequest.params.id} Error:`, inError);
            inResponse.status(500).send("error");
        }
    }
);
app.post("/messages",
    async (inRequest: Request, inResponse: Response) => {
        try {
            const smtpWorker: SMTP.Worker = new SMTP.Worker(serverInfo);
            await smtpWorker.sendMessage(inRequest.body);
            inResponse.send("ok");
        } catch (inError) {
            console.error("POST /messages Error:", inError);
            inResponse.status(500).send("error");
        }
    }
);
app.get("/contacts",
    async (inRequest: Request, inResponse: Response) => {
        try {
            const contactsWorker: Contacts.Worker = new Contacts.Worker();
            const contacts: IContact[] = await contactsWorker.listContacts();
            inResponse.json(contacts);
        } catch (inError) {
            console.error("GET /contacts Error:", inError);
            inResponse.status(500).send("error");
        }
    }
);
app.post("/contacts",
    async (inRequest: Request, inResponse: Response) => {
        try {
            const contactsWorker: Contacts.Worker = new Contacts.Worker();
            const contact: IContact = await contactsWorker.addContact
                (inRequest.body);
            inResponse.json(contact);
        } catch (inError) {
            console.error("POST /contacts Error:", inError);
            inResponse.status(500).send("error");
        }
    }
);
app.delete("/contacts/:id",
    async (inRequest: Request, inResponse: Response) => {
        try {
            const contactsWorker: Contacts.Worker = new Contacts.Worker();
            await contactsWorker.deleteContact(inRequest.params.id);
            inResponse.send("ok");
        } catch (inError) {
            console.error(`DELETE /contacts/${inRequest.params.id} Error:`, inError);
            inResponse.status(500).send("error");
        }
    }
);
// Start app listening.
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`MailBag server open for requests on port ${PORT}`);
});