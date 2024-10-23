"use client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Chessboard } from "react-chessboard";

export default function Replay({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [currentPosition, setCurrentPosition] = useState(0);
  const [position, setPosition] = useState([]);

  const getMoves = async () => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL+"/replay/" + params.id);
      if (response.ok) {
        const json = await response.json();
        return json.moves;
      } else {
        alert("Error fetching replay, reload the page.");
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getMoves().then((data: any) => {
      console.log(data);
      setPosition(data);
    });
  }, []);
  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4">
        <Button
          variant={"link"}
          onClick={() => {
            router.push("/");
          }}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back To Home
        </Button>
      </header>

      {/* Game area */}
      <div className="flex-1 p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md mb-4">
            Move: {currentPosition} / {position.length-1}
        </div>

        {/* Chess board */}
        <div className="w-full max-w-md aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg shadow-lg">
          <Chessboard
            areArrowsAllowed={true}
            arePiecesDraggable={true}
            id="ChessGameWithTimers"
            position={position[currentPosition]}
          />
        </div>

        <div className="mt-4 flex space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentPosition((prev) => {
                if (prev == 0) {
                    return prev
                }
                else 
                {
                    return prev-1
                }
              });
            }}
          >
            <ArrowLeft />
          </Button>
          <Button
            variant="outline"
            onClick={() => {
                setCurrentPosition((prev) => {
                    if (prev == position.length - 1) {
                        return prev
                    }
                    else 
                    {
                        return prev+1
                    }
                  });
            }}
          >
            <ArrowRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
