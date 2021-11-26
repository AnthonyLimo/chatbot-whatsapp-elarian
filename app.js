const { Elarian } = require("elarian");
const log = require("signale");

let client;

const whatsappChannel = {
    number: "+254711001002",
    channel: "whatsapp"
};
const voiceChannel ={
    number: "+254700112233",
    channel: "voice"
};

const stateHandlers = {
    initialState: async (ntf, cust, appData) => {
        console.log(ntf.text);
        console.log("SHow customer: ", cust);

        if (ntf.text) {
            cust.sendMessage(whatsappChannel, {
                body: {
                    text: "Hi there, I'm Cindy, your customer support bot. How can I help?\n1. Report an issue with your order \n2. Report an issue with the rider\n3. Request a call from one of our agents"
                }
            });

            return { state: "recordIssueState" };
        }
    },
    recordIssueState: async (ntf, cust, appData) => {
        console.log(appData);
        console.log(ntf.text);

        // Use a switch

        if (ntf.text === "1") {

            cust.sendMessage(whatsappChannel, {
                body: {
                    text: "We're sorry about the issue you faced with your order. Could you provide some more information on what happened?"
                }
            });
            cust.updateAppData({
                state: "callCustomerIssueState"
            });

        } else if (ntf.text === "2") {

            cust.sendMessage(whatsappChannel, {
                body: {
                    text: "We're sorry about the issue you faced with your rider. Could you provide some more information on what happened?"
                }
            });
            // cust.updateAppData({
            //     state: "callCustomerIssueState"
            // });

            return { state: "callCustomerIssueState" };

        } else if (ntf.text === "3") {

            cust.sendMessage(whatsappChannel, {
                body: {
                    text: "We're sorry about the issue you faced. One of our agents will reach out to you shortly."
                }
            });

            setInterval(() => {
                cust.sendMessage(voiceChannel, {
                    body: {
                        text: {
                            say: {
                                voice: "male",
                                text: "This is an automated call"
                            }
                        }
                    }
                })
            }, 5000);

            cust.deleteAppData();
        } else {
            cust.sendMessage(whatsappChannel, {
                body: {
                    text: "I'm sorry. It seems you selected an option I can't perform. Please try again.\n1. Report an issue with your order \n2. Report an issue with the rider\n3. Request a call from one of our agent"
                }
            });

            // cust.updateAppData({
            //     state: "recordIssueState"
            // });

            return { state: "recordIssueState" };
        }
    },
    callCustomerIssueState: async (ntf, cust) => {
        console.log(ntf.text);

        cust.sendMessage(voiceChannel, {
            body: {
                text: {
                    say: {
                        voice: "male",
                        text: "This is an automated call. Imagine rainbows flying"
                    }
                }
            }
        });

        cust.deleteAppData();
    }
};

async function handleWhatsappMessages(notification, customer, appData, callback) {
    //console.log(notification);

    log.info(`Processing Whatsapp session from customer: ${customer.customerNumber.number}`);

    //const userInput = (notification.text).toLowerCase();


    let currentState = appData || { state: 'initialState' };
    console.log("CS ", currentState)
    const {state} = currentState
    console.log("State ", state)

    const nextState = await stateHandlers[state](notification, customer, appData);

    callback(null, nextState);
}

const start = () => {
    client = new Elarian({
        appId: "el_app_rEpRxF",
        orgId: "el_org_eu_korGaF",
        apiKey: "el_k_test_ecf7d8227577e2a378a2ff83ef8ac6f799424d379615cdf3ed2636b655876acd"
    });

    client
        .on("error", (error) => console.log(`Something went wrong: ${error}`))
        .on("connected", () => console.log("App connected..."))
        .on("receivedWhatsapp", handleWhatsappMessages)
        .connect();
};

start();