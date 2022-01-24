require("dotenv").config();
const { Elarian } = require("elarian");
const log = require("signale");

let client;

const whatsappChannel = {
    number: process.env.WHATSAPP_NUMBER,
    channel: "whatsapp"
};

const voiceChannel ={
    number: process.env.VOICE_NUMBER,
    channel: "voice"
};

const stateHandlers = {

    /*
    In this initialState the user is presented with the initial text of the whatsapp session
    They will provide and input that will be handled by the recordIssueState
    In the event that something goes wrong, the state handler should return the same menu but with an
    apology and resending the initial message afterwards
    */

    initialState: async (ntf, cust, appData) => {

        try {
            log.info(`Current Customer Data on Level 1: ${appData}`);

            if (ntf.text) {
                let resp = await cust.sendMessage(whatsappChannel, {
                    body: {
                        text: "Hi there, I'm Cindy, your customer support bot. How can I help?\n1. Report an issue with your order \n2. Report an issue with the rider\n3. Request a call from one of our agents"
                    }
                });

                log.success(`First initial message sent: ${resp}`);
            }

            return { state: "recordIssueState" };
        } catch (error) {
            log.error(`Something went wrong: ${error}`);

            return { state: "initialState" };
        }
    },

    recordIssueState: async (ntf, cust, appData) => {
        console.log(appData);
        console.log(ntf.text);

        // Use a switch

        if (ntf.text === "1") {

            try {
                let resp = await cust.sendMessage(whatsappChannel, {
                    body: {
                        text: "We're sorry about the issue you faced with your order. Could you provide some more information on what happened?"
                    }
                });


                log.success(`Option 1 selected. Response: ${resp}`);

                return { state: "callCustomerIssueState" }
            } catch (error) {
                log.error(`Something went wrong: ${error}`);

                return { state: "recordIssueState" }
            }

        } else if (ntf.text === "2") {

            try {
                let resp = await cust.sendMessage(whatsappChannel, {
                    body: {
                        text: "We're sorry about the issue you faced with your rider. Could you provide some more information on what happened?"
                    }
                });

                log.success(`Option 2 selected. Response: ${resp}`);

                return { state: "callCustomerIssueState" };
            } catch (error) {
                log.error(`Something went wrong: ${error}`);

                return { state: "recordIssueState" };
            }

        } else if (ntf.text === "3") {

            try {

                let resp = await cust.sendMessage(whatsappChannel, {
                    body: {
                        text: "We're sorry about the issue you faced. One of our agents will reach out to you shortly."
                    }
                });

                log.success(`Option 3 selected. Response: ${resp}`);

                setTimeout(async () => {
                    let voiceResp = await cust.sendMessage(voiceChannel, {
                        body: {
                            text: {
                                say: {
                                    voice: "male",
                                    text: "This is an automated call"
                                }
                            }
                        }
                    });

                    log.info(`Voice call made: ${voiceResp}`);
                }, 5000);

                return { state: "initialState" };

            } catch (error) {
                log.error(`Something wrong: ${error}`);

                return { state: "recordIssueState" };
            }
        } else {
            try {
                const resp = await cust.sendMessage(whatsappChannel, {
                    body: {
                        text: "I'm sorry. It seems you selected an option I can't perform. Please try again.\n1. Report an issue with your order \n2. Report an issue with the rider\n3. Request a call from one of our agent"
                    }
                });

                log.warn(`Things went wrong: ${resp}`);

                return { state: "recordIssueState" };
            } catch(error) {
                log.error(error);

                return { state: "recordIssueState" };
            }
        }
    },

    callCustomerIssueState: async (ntf, cust) => {
        console.log(ntf.text);

        try {
            const resp = await cust.sendMessage(voiceChannel, {
                body: {
                    voice: [
                        {
                            say: {
                                text: "We'll give you a call shortly",
                                voice: "male"
                            },
                        },
                    ]
                }
            });

            log.info(`Customer called on number ${cust.customerNumber.number} with the following response: ${resp}`);


            return { state: "initialState" };

        }  catch(error) {

            log.error(`Something went wrong ${error}`);

            return { state: "callCustomerIssueState" };

        }

    }
};

async function handleWhatsappMessages(notification, customer, appData, callback) {
    console.log(notification);

    log.info(`Processing Whatsapp session from customer: ${customer.customerNumber.number}`);

    console.log("This is our appdata: ", appData);

    let currentState;

    if (!appData) {
        currentState = {state: 'initialState'};
    } else {
        currentState = appData;
        log.info(`Returning user at state: ${currentState}`);
    }

    const {state} = currentState;

    const nextState = await stateHandlers[state](notification, customer, state);

    console.log("This is the next state" , nextState);

    await customer.leaseAppData();

    await customer.updateAppData(nextState);
}


const start = () => {
    client = new Elarian({
        appId: process.env.APP_ID,
        orgId: process.env.ORG_ID,
        apiKey: process.env.API_KEY
    });

    client
        .on("error", (error) => log.error(`Something went wrong: ${error}`))
        .on("connected", () => log.success("App connected..."))
        .on("receivedWhatsapp", handleWhatsappMessages)
        .connect();
};

start();