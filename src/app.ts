import AppFacade from "./facade";

function main() {
    const facade = AppFacade.getInstance();

    facade.run();

    process.on("uncaughtException", () => { });
    process.on("unhandledRejection", () => { });
    process.on("rejectionHandled", () => { });
}

main();

