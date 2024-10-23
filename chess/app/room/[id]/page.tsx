"use client"
import ChessGame from '@/components/room'
import React from 'react'

export default function Page({params}:{params:{id:string}}) {
  return (
    <ChessGame id={params.id}> 
    </ChessGame>
  )
}
