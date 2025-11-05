import { useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { useUserStore } from "@/src/store/userStore";
import { shallow } from "zustand/shallow";


let socket: Socket;

export const useSocket = () => {
  const { user } = useUserStore(
    (state: any) => ({
      user: state.user,
    }),
    shallow
  );
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "ws://localhost:4000", {
        transports: ["websocket"],
      });

      socketRef.current = socket;

      if (user?.id) {
        socket.emit("register", user.id);
      }
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user?.id]);

  return socketRef.current;
};
