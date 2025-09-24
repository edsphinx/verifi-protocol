import type { MoveFunctionId } from "@aptos-labs/ts-sdk";
import { aptosClient } from "../client";
import { MODULE_ADDRESS } from "../constants";

/**
 * A view function that checks if the global message resource exists.
 * This is a safer way to query before trying to fetch the content.
 */
export async function doesMessageExist(): Promise<boolean> {
  if (!MODULE_ADDRESS) {
    throw new Error("Module address is not set.");
  }

  try {
    const payload = {
      function:
        `${MODULE_ADDRESS}::message_board::exist_message` as MoveFunctionId,
      functionArguments: [], // Correct: This function takes no arguments
    };
    const result = await aptosClient().view<[boolean]>({ payload });
    return result[0];
  } catch (error) {
    console.error("Failed to check if message exists:", error);
    return false;
  }
}

/**
 * A view function to get the message content from the message board module.
 * It now first checks if the message exists before trying to fetch it.
 */
export const getMessageContent = async (): Promise<string | null> => {
  if (!MODULE_ADDRESS) {
    throw new Error("Module address is not set.");
  }

  // First, check if the message resource exists.
  const messageExists = await doesMessageExist();

  if (!messageExists) {
    // If it doesn't exist, return null instead of trying to fetch and causing an error.
    console.log("No message resource found for this contract.");
    return null;
  }

  // If it exists, proceed to fetch the content.
  const payload = {
    function:
      `${MODULE_ADDRESS}::message_board::get_message_content` as MoveFunctionId,
    functionArguments: [], // Correct: This function takes no arguments
  };

  try {
    const result = await aptosClient().view<[string]>({ payload });
    return result[0];
  } catch (error) {
    console.error("Failed to fetch message content:", error);
    return null;
  }
};
