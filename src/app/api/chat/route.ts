import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth-session";
import {
  getUserConversations,
  getOrCreateConversation,
  getConversationMessages,
  sendMessage,
  toggleUserBlock,
} from "@/lib/marketplace-service";

// GET /api/chat?conversationId=... -> fetch messages OR list conversations
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      const messages = await getConversationMessages(conversationId, user.id);
      return NextResponse.json({ messages });
    }

    const conversations = await getUserConversations(user.id);
    return NextResponse.json({ conversations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch chat data" }, { status: 500 });
  }
}

// POST /api/chat -> Start conversation or send message or block
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "start_conversation") {
      const { targetUserId, listingId } = body;
      if (!targetUserId) {
        return NextResponse.json({ error: "Missing target user ID." }, { status: 400 });
      }
      const conv = await getOrCreateConversation(user.id, targetUserId, listingId);
      return NextResponse.json({ conversation: conv });
    }

    if (action === "send_message") {
      const { conversationId, recipientId, messageText, audioUrl, audioDurationSeconds } = body;
      if (!conversationId || !recipientId || (!messageText && !audioUrl)) {
        return NextResponse.json({ error: "Missing required message parameters." }, { status: 400 });
      }
      const msg = await sendMessage({
        conversationId,
        senderId: user.id,
        recipientId,
        messageText: messageText || "",
        audioUrl,
        audioDurationSeconds,
      });
      return NextResponse.json({ success: true, message: msg });
    }

    if (action === "block_user") {
      const { targetUserId, reason } = body;
      if (!targetUserId) {
        return NextResponse.json({ error: "Missing target user ID." }, { status: 400 });
      }
      const res = await toggleUserBlock(user.id, targetUserId, reason);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed processing chat request" }, { status: 500 });
  }
}
