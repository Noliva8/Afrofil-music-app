import React, { useEffect, useRef, useState } from "react";
import { Box, CircularProgress, TextField, Button } from "@mui/material";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { BOOKING_MESSAGES } from "../../utils/queries";
import { SEND_MESSAGE } from "../../utils/mutations";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ bookingId, currentUser }) {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const { data, loading, refetch } = useQuery(BOOKING_MESSAGES, {
    variables: { bookingId },
    skip: !bookingId,
    notifyOnNetworkStatusChange: true,
  });

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE, {
    onCompleted: () => {
      setNewMessage("");
      refetch();
    },
  });

  useEffect(() => {
    if (data?.bookingMessages) {
      setMessages(data.bookingMessages);
    }
  }, [data]);

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
