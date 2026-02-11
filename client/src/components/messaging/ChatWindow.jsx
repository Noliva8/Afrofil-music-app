import { useEffect, useRef, useState } from "react";
import { Box, CircularProgress, TextField, Button } from "@mui/material";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { BOOKING_MESSAGES, NEW_MESSAGE } from "../../utils/queries";
import { SEND_MESSAGE, MARK_MESSAGES_READ_BY_USER } from "../../utils/mutations";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ bookingId, currentUser }) {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const { data, loading } = useQuery(BOOKING_MESSAGES, {
    variables: { bookingId },
    skip: !bookingId,
    notifyOnNetworkStatusChange: true,
  });

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE, {
    onCompleted: ({ sendMessage: message }) => {
      setNewMessage("");
      setMessages((prev) => {
        const exists = prev.find((item) => item._id === message._id);
        if (exists) {
          return prev.map((item) => (item._id === message._id ? message : item));
        }
        return [...prev, message];
      });
    },
  });
  const [markMessagesRead] = useMutation(MARK_MESSAGES_READ_BY_USER);
  const { data: subscriptionData } = useSubscription(NEW_MESSAGE, {
    variables: { bookingId },
    skip: !bookingId,
  });

  useEffect(() => {
    if (data?.bookingMessages) {
      setMessages(data.bookingMessages);
    }
  }, [data]);

  useEffect(() => {
    if (subscriptionData?.newMessage) {
      const incoming = subscriptionData.newMessage;
      setMessages((prev) => {
        const exists = prev.find((item) => item._id === incoming._id);
        if (exists) {
          return prev.map((item) => (item._id === incoming._id ? incoming : item));
        }
        return [...prev, incoming];
      });
    }
  }, [subscriptionData]);

  useEffect(() => {
    if (!bookingId || !data?.bookingMessages?.length) return;
    if (!currentUser?.id) return;
    const hasUnread = data.bookingMessages.some(
      (msg) => msg.senderType === "ARTIST" && !msg.readByUser
    );
    if (!hasUnread) return;
    markMessagesRead({ variables: { bookingId } }).catch(() => {});
  }, [bookingId, data, markMessagesRead, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!newMessage.trim() || !bookingId) return;
    await sendMessage({
      variables: {
        input: {
          bookingId,
          content: newMessage.trim(),
        },
      },
    });
  };

  if (loading) return <CircularProgress size={24} />;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, height: "100%" }}>
      
      <Box flex={1} sx={{ overflowY: "auto", px: 1, display: "flex", flexDirection: "column" }}>
        {messages.length === 0 ? (
          <Box sx={{ textAlign: "center", color: "text.secondary", mt: 2 }}>
            No messages yet.
          </Box>
        ) : (
          messages.map((message) => {
            const isArtistUserType = currentUser?.type === "artist";
            const isOwn = isArtistUserType
              ? message.senderType === "ARTIST"
              : message.senderType === "USER";
            return (
              <MessageBubble key={message._id} message={message} isOwnMessage={isOwn} />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Box component="form" onSubmit={handleSend} sx={{ display: "flex", gap: 1 }}>
        <TextField
          multiline
          minRows={2}
          placeholder="Type your message..."
          value={newMessage}
          autoFocus
          onChange={(event) => setNewMessage(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSend(event);
          }
        }}
          fullWidth
          disabled={!bookingId || sending}
        />
        <Button type="submit" variant="contained" disabled={!newMessage.trim() || sending}>
          Send
        </Button>
      </Box>
    </Box>
  );
}
