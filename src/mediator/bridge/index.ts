import { Mediator, IMediator, INotifier, IFacade } from "pure-framework";
import { IObserver, Observer, INotification } from "pure-framework";
import { Events } from "../../base/events";
import EntanmoProxy from "../../proxy/entanmo";
import SmartDBProxy from "../../proxy/smartdb";

class BridgeMediator extends Mediator implements IMediator, INotifier {
    static TAGName = "MEDIATOR_BRIDGE";

    private _observer: IObserver;
    constructor(facade: IFacade) {
        super(BridgeMediator.TAGName, facade);

        this._observer = new Observer(this.onNotification, this);
    }

    onRegister(): void {
        super.onRegister();

        this.facade.registerObserver(Events.Evt_AppReady, this._observer);
        this.facade.registerObserver(Events.Evt_NewBlock, this._observer);
    }

    onRemove(): void {
        this.facade.removeObserver(Events.Evt_NewBlock, this);
        this.facade.removeObserver(Events.Evt_AppReady, this);

        super.onRemove();
    }

    private onNotification(notification: INotification): void {
        const name = notification.getName();
        if (name === Events.Evt_AppReady) {
            this.onAppReadyEvent();
        } else if (name === Events.Evt_NewBlock) {
            this.onNewBlockEvent(notification.getBody() as { height: number });
        }
    }

    private onAppReadyEvent(): void {
        const self = this;
        setImmediate(function _tick() {
            if (self.SmartDBProxy.IsInited) {
                let height = self.SmartDBProxy.LastHeight;
                if (height === undefined) {
                    height = -1;
                }
                self.EntanmoProxy.start(height);
                return;
            }

            setTimeout(_tick, 1000);
        });
        // let height = this.SmartDBProxy.LastHeight;
        // // console.log(`onAppReadyEvent last height = ${height}`);
        // if (height === undefined) {
        //     height = -1;
        // }
        // this.EntanmoProxy.start(height);
    }

    private onNewBlockEvent(data: { height: number }): void {
        const block = this.EntanmoProxy.getBlock(data.height);
        console.log(`onNewBlockEvent(${data.height}), ${JSON.stringify(block)}`);
        if (block) {
            this.SmartDBProxy.setBlock(block, () => { });
        }
    }


    /// 
    private get EntanmoProxy(): EntanmoProxy {
        return this.facade.retrieveProxy(EntanmoProxy.TAGName) as EntanmoProxy;
    }

    private get SmartDBProxy(): SmartDBProxy {
        return this.facade.retrieveProxy(SmartDBProxy.TAGName) as SmartDBProxy;
    }
}

export default BridgeMediator;