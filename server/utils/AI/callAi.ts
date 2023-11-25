import { MessageData } from "../../data/interfaces/MessageData";
import { removeConjunctions } from "../optimizer/removeConjunctions";

require('dotenv').config();

//OpenAI
const OpenAIApi = require('openai');
const openai = new OpenAIApi({
    apiKey: process.env.OPENAI_API_KEY
});
//

export async function callAi(messages: MessageData[], roomId: string, io: any) {
    try {
        const completion = await openai.chat.completions.create({
            model: /*"gpt-4-1106-preview",*/ "gpt-3.5-turbo-1106",
            messages: messages,
        });

        const answer = completion.choices[0].message.content;
        if (answer) {
            messages.push({ role: "assistant", content: removeConjunctions(answer) })

            io.to(roomId).emit("getStoryText", answer);
        }
    } catch (error: any) {
        console.error("Error calling OpenAI API:", error.message);
    }
}