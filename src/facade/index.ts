import { IFacade, Facade } from "pure-framework";
import { Events } from "../base/events";

import EntanmoProxy from "../proxy/entanmo";
import SmartDBProxy from "../proxy/smartdb";

import BridgeMediator from "../mediator/bridge";

class AppFacade extends Facade implements IFacade {
    private static _instance: AppFacade;
    static getInstance(): AppFacade {
        if (AppFacade._instance === undefined) {
            AppFacade._instance = new AppFacade();

            AppFacade._instance.initProxies();
            AppFacade._instance.initMediators();
        }

        return AppFacade._instance;
    }

    constructor() {
        super();
    }

    private initProxies(): void {
        this.registerProxy(new EntanmoProxy(this));
        this.registerProxy(new SmartDBProxy(this));
    }

    private initMediators(): void {
        this.registerMediator(new BridgeMediator(this));
    }

    run(): void {
        this.sendNotification(Events.Evt_AppReady);
    }
}

export default AppFacade;