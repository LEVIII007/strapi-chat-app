'use server';

import { auth } from "../auth";

export async function getChatSessions() {
    const session = await auth();

    if (!session || !session.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/chat-sessions?filters[users_permissions_user][id][$eq]=${session.user.id}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${session.jwt}`,
                    "Content-Type": "application/json",
                },
            }
        );

        // response example : 
        // {
        //     "data": [
        //         {
        //             "id": 4,
        //             "documentId": "k7nqsahwzdl1s38kmmg3utuc",
        //             "title": "testing2",
        //             "description": "hahaha",
        //             "createdAt": "2025-02-14T08:40:15.600Z",
        //             "updatedAt": "2025-02-14T08:40:15.600Z",
        //             "publishedAt": "2025-02-14T08:40:16.925Z"
        //         }
        //     ],
        //     "meta": {
        //         "pagination": {
        //             "page": 1,
        //             "pageSize": 25,
        //             "pageCount": 1,
        //             "total": 1
        //         }
        //     }
        // }

        if (!response.ok) {
            throw new Error(`Failed to fetch chat sessions: ${response.statusText}`);
        }

        const data = await response.json();
      
        return { success: true, data };
    }
    catch (error) {
        console.error("Error fetching chat sessions:", error);
        return { success: false, message: "Error fetching chat sessions" };
    }
}



async function getChatSessionById(id : string) {
    const session = await auth();

    if (!session || !session.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/chat-sessions/${id}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${session.jwt}`, // ✅ Add JWT Token for authentication
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch chat session: ${response.statusText}`);
        }

        const data = await response.json();

        return { success: true, data };
    }
    catch (error) {
        console.error("Error fetching chat session:", error);
        return { success: false, message: "Error fetching chat session" };
    }
}

export async function createChatSession(data: { title: string; description: string }) {
    const session = await auth();

    if (!session || !session.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/chat-sessions`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.jwt}`, // ✅ Ensuring authentication is passed
                    "Content-Type": "application/json", // ✅ Explicitly setting the content type
                },
                body: JSON.stringify({
                    data: {
                        title: data.title,
                        description: data.description,
                        users_permissions_user: session.user.id, // ✅ Ensure id is correctly passed
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json(); // Capture server error details
            throw new Error(`Failed to create chat session: ${errorData?.error?.message || response.statusText}`);
        }

        const responseData = await response.json();
        return { success: true, data: responseData };
    } catch (error: unknown) {
        console.error("Error creating chat session:", error);
        return { success: false, message: error instanceof Error ? error.message : "Error creating chat session" };
    }
}


// export async function getChatMessages(chatSessionId: number) {
//     const session = await auth();

//     if (!session || !session.user?.id) {
//         return { success: false, message: "Unauthorized" };
//     }

//     try {
//         const response = await fetch(
//             `${process.env.NEXT_PUBLIC_API_URL}/api/messages?filters[chat_session][id][$eq]=${chatSessionId}&populate=*`,
//             {
//                 headers: {
//                     Authorization: `Bearer ${session.jwt}`,
//                     "Content-Type": "application/json",
//                 },
//             }
//         );

//         if (!response.ok) {
//             throw new Error(`Failed to fetch messages: ${response.statusText}`);
//         }

//         const data = await response.json();
//         return { success: true, data: data.data };
//     } catch (error) {
//         console.error("Error fetching messages:", error);
//         return { success: false, message: "Error fetching messages" };
//     }
// }


export async function deleteChatSession(chatSessionId: number) {
    const session = await auth();

    if (!session || !session.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/chat-sessions/${chatSessionId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${session.jwt}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to delete chat session: ${response.statusText}`);
        }

        return { success: true, message: "Chat session deleted successfully" };
    } catch (error) {
        console.error("Error deleting chat session:", error);
        return { success: false, message: "Error deleting chat session" };
    }
}


export async function saveMessage(chatSessionId: number, content: string, sender: "user" | "server") {
    const session = await auth();

    if (!session || !session.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        // Verify that the chat session exists and belongs to the user
        const chatResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/chat-sessions/${chatSessionId}`,
            {
                headers: {
                    Authorization: `Bearer ${session.jwt}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!chatResponse.ok) {
            return { success: false, message: "Chat session not found or access denied" };
        }

        // Save the message in the database
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/messages`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.jwt}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    data: {
                        content,
                        sender,
                        chat_session: chatSessionId, // Link message to chat session
                        timestamp: new Date().toISOString(), // Store timestamp
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return { success: false, message: `Failed to save message: ${errorData?.error?.message || response.statusText}` };
        }

        const messageData = await response.json();
        return { success: true, data: messageData };
    } catch (error) {
        console.error("Error saving message:", error);
        return { success: false, message: "Internal Server Error" };
    }
}



export async function getChatMessages(chatSessionId: number) {
    const session = await auth();

    if (!session || !session.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/messages?filters[chat_session][id][$eq]=${chatSessionId}&sort=timestamp:asc`,
            {
                headers: {
                    Authorization: `Bearer ${session.jwt}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            return { success: false, message: "Failed to fetch messages" };
        }

        const data = await response.json();
        return { success: true, data: data.data };
    } catch (error) {
        console.error("Error fetching messages:", error);
        return { success: false, message: "Internal Server Error" };
    }
}


export async function deleteMessage(messageId: number) {
    const session = await auth();

    if (!session || !session.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/messages/${messageId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${session.jwt}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            return { success: false, message: "Failed to delete message" };
        }

        return { success: true, message: "Message deleted successfully" };
    } catch (error) {
        console.error("Error deleting message:", error);
        return { success: false, message: "Internal Server Error" };
    }
}