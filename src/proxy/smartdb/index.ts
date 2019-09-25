import path from "path";
import fs from "fs";

import { Proxy, IProxy, INotifier, IFacade } from "pure-framework";
import { IObserver, Observer, INotification } from "pure-framework";
import { SmartDB } from "smart-db/dist/SmartDB";
import { Events } from "../../base/events";

import Transactions from "./model/Transaction";
import { ModelSchema } from "smart-db/dist/Model";
import { Entity } from "smart-db/dist/Common";
import { BlockEntity } from "../../base/Common";

class SmartDBProxy extends Proxy implements IProxy, INotifier {
    static TAGName = "SMART_DB_PROXY";

    private _observer: IObserver;
    private _smartdb: SmartDB;
    private _inited: boolean;
    constructor(facade: IFacade) {
        super(SmartDBProxy.TAGName, facade);

        this._observer = new Observer(this.onNotification, this);
        const rootdir = path.resolve(path.join(__dirname, "..", "..", "..", "datas"));
        if (!fs.existsSync(rootdir)) {
            fs.mkdirSync(rootdir);
        }
        this._smartdb = new SmartDB(path.join(rootdir, "blockchain.db"), path.join(rootdir, "block"));
        // this._smartdb = new SmartDB("../../../datas/blockchain.db", "../../../datas/block");
        this._inited = false;
    }

    onRegister(): void {
        super.onRegister();

        this.facade.registerObserver(Events.Evt_AppReady, this._observer);
    }

    onRemove(): void {
        this.facade.removeObserver(Events.Evt_AppReady, this);

        this.onRemove();
    }

    get IsInited(): boolean {
        return this._inited;
    }

    get LastHeight(): number | undefined {
        if (!this.IsInited) return undefined;
        return this._smartdb.lastBlockHeight;
    }

    setBlock(block: BlockEntity, cb: Function): void {
        console.log(`setBlock(${this._inited}) ${block.height}, ${JSON.stringify(block)}`);
        if (!this._inited) {
            cb && cb("Uninited");
            return;
        }

        this._smartdb.beginBlock(block as any);
        const transactions = block.transactions;
        for (const tr of transactions) {
            this._smartdb.create<Entity>("Transaction", tr);
        }
        this._smartdb.commitBlock()
            .then(() => cb && cb())
            .catch(error => {
                console.log("error: ", error);
                cb && cb(error.toString())
            });
    }

    private onNotification(notification: INotification): void {
        const name = notification.getName();
        if (name === Events.Evt_AppReady) {
            this.onAppReadyEvent();
        }
    }

    private onAppReadyEvent(): void {
        const schemas: ModelSchema<Entity>[] = [];
        schemas.push(new ModelSchema(Transactions, "Transaction"));
        this._smartdb.init(schemas)
            .then(result => {
                this._inited = true;
            })
            .catch(error => {
                // TODO
            });
    }
}

export default SmartDBProxy;