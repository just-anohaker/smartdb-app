import { Proxy, IProxy, IFacade, INotifier } from "pure-framework";
import { INotification, IObserver, Observer } from "pure-framework";
import axios, { AxiosResponse } from "axios";
import { Events } from "../../base/events";
import { BlockEntity } from "../../base/Common";

const InnerEventStart = "inner_event_start";

class EntanmoProxy extends Proxy implements IProxy, INotifier {
    static TAGName = "PROXY_ENTANMO";

    private _observer: IObserver;
    private _blocks: Map<number, BlockEntity>;
    private _currentHeight: number;
    private _started: boolean;
    constructor(facade: IFacade) {
        super(EntanmoProxy.TAGName, facade);

        this._observer = new Observer(this.onNotification, this);
        this._blocks = new Map();
        this._currentHeight = 0;
        this._started = false;
    }

    onRegister(): void {
        super.onRegister();

        // this.facade.registerObserver(Events.Evt_AppReady, this._observer);
        this.facade.registerObserver(InnerEventStart, this._observer);
    }

    onRemove(): void {
        // this.facade.removeObserver(Events.Evt_AppReady, this);
        this.facade.removeObserver(InnerEventStart, this);

        super.onRemove();
    }

    getBlock(height: number): BlockEntity | undefined {
        if (!this._blocks.has(height)) {
            return undefined;
        }
        return this._blocks.get(height);
    }

    consumeBlock(height: number): void {
        if (this._blocks.has(height)) {
            this._blocks.delete(height);
        }
    }

    consumeBlocks(minHeight: number, maxHeight: number): void {
        for (let i = minHeight; i <= maxHeight; i++) {
            this.consumeBlock(i);
        }
    }

    start(height: number): void {
        if (this._started) {
            return;
        }

        this._currentHeight = height;
        console.log(`start height(${this._currentHeight})`);
        this.sendNotification(InnerEventStart);
    }

    private onNotification(notification: INotification): void {
        const name = notification.getName();
        if (name === InnerEventStart) {
            this.onInnerStartEvent();
        }
    }

    private onInnerStartEvent(): void {
        if (this._started) return;
        this._started = true;
        const self = this;
        setImmediate(function _tick() {
            const getHeight = self._currentHeight <= 0 ? 1 : self._currentHeight + 1;
            console.log(`start get block(${getHeight})`);
            axios.get(`http://47.111.160.173:4096/api/blocks/full?height=${getHeight}`)
                .then((resp: AxiosResponse<any>) => {
                    if (resp.status === 200 && resp.data.success) {
                        // handle block
                        const block = Object.assign({}, resp.data.block);
                        block.height = block.height - 1;
                        block.delegate = block.generatorPublicKey;
                        for (let tr of block.transactions) {
                            tr.height = tr.height - 1;
                        }
                        self._blocks.set(block.height, block);
                        self._currentHeight = getHeight;
                        self.sendNotification(Events.Evt_NewBlock, { height: block.height });
                    }
                    setTimeout(_tick, 1000);
                })
                .catch(error => {
                    setTimeout(_tick, 1000);
                });
        });

    }
}

export default EntanmoProxy;