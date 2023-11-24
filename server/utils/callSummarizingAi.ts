import { MessageData } from "../data/interfaces/MessageData";
require('dotenv').config();

//OpenAI
const OpenAIApi = require('openai');
const openai = new OpenAIApi({
    apiKey: process.env.OPENAI_API_KEY
});
//

const prompt = "Record tabletop RPG data efficiently: capture player currency, items, location, building, NPCs, and purchases; update inventory and deduct costs; summarize history concisely without speculative information; prioritize GM-relevant details; rephrase initial assistant message within one line."
export async function callSummarizingAi(storyMessages: MessageData[], callLocalAi: () => void) {
    let messageInString: string = "";
    storyMessages.forEach((message) => {
        if (message.role === "assistant") {
            messageInString += message.content;
        }
    })
    const message: MessageData[] = [
        { role: "system", content: prompt },
        { role: "user", content: messageInString }
    ];

    try {
        console.log("called sum ai")
        const completion = await openai.chat.completions.create({
            model: /*"gpt-4-1106-preview",*/ "gpt-3.5-turbo-1106",
            messages: message,
        });
        console.log("post sum completion")

        const answer = completion.choices[0].message.content;
        if (answer !== "") {
            storyMessages.splice(1, 0, { role: "assistant", content: answer });
            console.log(storyMessages);
            await callLocalAi();
        }
    } catch (error: any) {
        console.error("Error calling OpenAI API:", error.message);
    }
}